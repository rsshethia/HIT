import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  ZoomIn, 
  const [currentZoom, setCurrentZoom] = useState(1);

// Function to calculate which message types contain a segment
const getMessageTypesForSegment = (segmentId) => {
  return messageTypes.filter(type => type.segments.includes(segmentId));
};

// Prepare data for force-directed graph
useEffect(() => {
  // Create nodes for segments and message types
  const segmentNodes = allSegments.map(segment => {
    const usage = getMessageTypesForSegment(segment.id).length;
    return {
      id: segment.id,
      name: segment.name,
      description: segment.description,
      type: 'segment',
      group: 1,
      value: usage
    };
  });

  const messageNodes = messageTypes.map(msgType => {
    return {
      id: msgType.id,
      name: msgType.name,
      type: 'message',
      segments: msgType.segments,
      group: 2,
      value: msgType.segments.length
    };
  });

  // Create links from segments to message types
  const links = [];
  segmentNodes.forEach(segment => {
    const containingMessages = getMessageTypesForSegment(segment.id);
    containingMessages.forEach(msg => {
      links.push({
        source: segment.id,
        target: msg.id,
        value: 1
      });
    });
  });

  setGraphData({
    nodes: [...segmentNodes, ...messageNodes],
    links: links
  });
}, []);

// Render force-directed graph with D3
useEffect(() => {
  if (!svgRef.current || graphData.nodes.length === 0) return;

  // Clear the svg first
  d3.select(svgRef.current).selectAll("*").remove();

  const svg = d3.select(svgRef.current);
  const width = svgRef.current.clientWidth || 900;
  const height = svgRef.current.clientHeight || 600;

  // Create a filtered version of the data based on filterValue
  let filteredData = { ...graphData };
  if (filterValue > 0) {
    const filteredSegmentNodes = graphData.nodes.filter(
      node => node.type === 'segment' && node.value >= filterValue
    );
    const filteredSegmentIds = filteredSegmentNodes.map(node => node.id);

    const filteredLinks = graphData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      return filteredSegmentIds.includes(sourceId);
    });

    const messageIdsInFilteredLinks = new Set();
    filteredLinks.forEach(link => {
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      messageIdsInFilteredLinks.add(targetId);
    });

    const filteredMessageNodes = graphData.nodes.filter(
      node => node.type === 'message' && messageIdsInFilteredLinks.has(node.id)
    );

    filteredData = {
      nodes: [...filteredSegmentNodes, ...filteredMessageNodes],
      links: filteredLinks
    };
  }

  // Create a container group for the zoom behavior
  const container = svg.append("g");

  // Create a background rect to detect clicks on empty space
  container.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "transparent")
    .on("click", () => {
      // Only reset if clicking on the background, not on a node
      if (d3.event && d3.event.defaultPrevented) {
        return; // If event was already handled by a node
      }
      setSelectedNode(null);
      resetHighlighting();
    });

  // Create a zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.2, 3])
    .on("zoom", (event) => {
      container.attr("transform", event.transform);
      setCurrentZoom(event.transform.k);
    });

  // Apply zoom behavior to SVG
  svg.call(zoom);

  // Create a simulation for the force-directed graph
  const simulation = d3.forceSimulation()
    .nodes(filteredData.nodes)
    .force("link", d3.forceLink()
      .id(d => d.id)
      .links(filteredData.links)
      .distance(100))
    .force("charge", d3.forceManyBody().strength(-400))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(0.1))
    .force("y", d3.forceY(height / 2).strength(0.1));

  // Create links
  const link = container.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(filteredData.links)
    .enter().append("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", d => Math.sqrt(d.value));

  // Create nodes
  const node = container.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(filteredData.nodes)
    .enter().append("g")
    .attr("class", "node")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
    .on("click", (event, d) => {
      event.stopPropagation(); // Prevent the click from bubbling to the background
      setSelectedNode(d);
      highlightConnections(d);
    });

  // Add circles to nodes
  node.append("circle")
    .attr("r", d => d.type === 'segment' ? 8 + (d.value * 0.5) : 12)
    .attr("fill", d => d.type === 'segment' ? "#4299e1" : "#f6ad55")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  // Add text labels to nodes
  node.append("text")
    .attr("dy", d => d.type === 'segment' ? -12 : 16)
    .attr("text-anchor", "middle")
    .attr("font-size", d => d.type === 'segment' ? "10px" : "12px")
    .attr("font-weight", d => d.type === 'segment' ? "normal" : "bold")
    .text(d => d.id);

  // Add title for hover tooltip
  node.append("title")
    .text(d => `${d.name}\n${d.type === 'segment' ? 'Used in ' + d.value + ' message types' : 'Contains ' + (d.segments?.length || 0) + ' segments'}`);

  // Update positions on each tick of the simulation
  simulation.on("tick", () => {
    link
      .attr("x1", d => {
        const source = d.source;
        return source.x || 0;
      })
      .attr("y1", d => {
        const source = d.source;
        return source.y || 0;
      })
      .attr("x2", d => {
        const target = d.target;
        return target.x || 0;
      })
      .attr("y2", d => {
        const target = d.target;
        return target.y || 0;
      });

    node.attr("transform", d => `translate(${d.x || 0}, ${d.y || 0})`);
  });

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  function highlightConnections(d) {
    // Reset all links and nodes to default opacity
    link.attr("stroke-opacity", 0.6);
    node.selectAll("circle").attr("opacity", 1);
    node.selectAll("text").attr("opacity", 1);

    // If a node is selected, highlight its connections
    if (d) {
      // Dim all nodes and links
      link.attr("stroke-opacity", 0.1);
      node.selectAll("circle").attr("opacity", 0.2);
      node.selectAll("text").attr("opacity", 0.2);

      // Highlight the selected node
      node.filter(n => n.id === d.id)
        .selectAll("circle, text")
        .attr("opacity", 1)
        .attr("stroke-width", 2);

      // Get connected nodes
      const connectedNodeIds = new Set();

      if (d.type === 'segment') {
        // For segments, get all message types that include it
        filteredData.links.forEach(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;

          if (sourceId === d.id) {
            connectedNodeIds.add(targetId);
          }
        });
      } else {
        // For message types, get all segments they contain
        filteredData.links.forEach(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;

          if (targetId === d.id) {
            connectedNodeIds.add(sourceId);
          }
        });
      }

      // Highlight connected nodes
      node.filter(n => connectedNodeIds.has(n.id))
        .selectAll("circle, text")
        .attr("opacity", 1);

      // Highlight connecting links
      link.filter(l => {
        const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
        const targetId = typeof l.target === 'string' ? l.target : l.target.id;
        return (sourceId === d.id && connectedNodeIds.has(targetId)) ||
          (targetId === d.id && connectedNodeIds.has(sourceId));
      })
        .attr("stroke-opacity", 1)
        .attr("stroke-width", l => Math.sqrt(l.value) * 2);
    }
  }

  // Function to reset all highlighting
  function resetHighlighting() {
    link.attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.value));
    node.selectAll("circle")
      .attr("opacity", 1)
      .attr("stroke-width", 1.5);
    node.selectAll("text")
      .attr("opacity", 1);
  }

  return () => {
    simulation.stop();
  };
}, [graphData, filterValue]);

// Helper functions for UI controls
const handleZoomIn = () => {
  if (!svgRef.current) return;

  const svg = d3.select(svgRef.current);
  const currentTransform = d3.zoomTransform(svg.node());
  const newTransform = currentTransform.scale(1.2);

  svg.transition()
    .duration(300)
    .call(d3.zoom().transform, newTransform);

  setCurrentZoom(newTransform.k);
};

const handleZoomOut = () => {
  if (!svgRef.current) return;

  const svg = d3.select(svgRef.current);
  const currentTransform = d3.zoomTransform(svg.node());
  const newTransform = currentTransform.scale(0.8);

  svg.transition()
    .duration(300)
    .call(d3.zoom().transform, newTransform);

  setCurrentZoom(newTransform.k);
};

const handleReset = () => {
  if (!svgRef.current) return;

  const svg = d3.select(svgRef.current);
  svg.transition()
    .duration(500)
    .call(d3.zoom().transform, d3.zoomIdentity);

  setSelectedNode(null);
  setFilterValue(0);
  setCurrentZoom(1);
};

return (
  <div className="container mx-auto p-4">
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">HL7 Segment to Message Type Relationship</h2>
        <p className="text-sm text-gray-600 mt-1">
          Explore how HL7 segments relate to different message types using this interactive visualization.
          Segments are blue circles, and message types are orange circles.
        </p>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-4 w-4 mr-1" /> Zoom In
            </button>
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-4 w-4 mr-1" /> Zoom Out
            </button>
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700"
              onClick={handleReset}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Reset
            </button>
            <div className="text-sm text-gray-500">
              Zoom: {Math.round(currentZoom * 100)}%
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm">Filter by segment usage:</span>
            <div className="w-40 h-2 bg-gray-200 rounded-full relative">
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={filterValue}
                onChange={(e) => setFilterValue(parseInt(e.target.value))}
                className="absolute w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${(filterValue / 8) * 100}%` }}
              ></div>
              <div
                className="absolute top-0 h-2 w-2 bg-indigo-600 rounded-full"
                style={{ left: `${(filterValue / 8) * 100}%`, transform: 'translateX(-50%)' }}
              ></div>
            </div>
            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${filterValue > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
              }`}>
              {filterValue > 0 ? `${filterValue}+ message types` : 'No filter'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2 relative">
            <svg
              ref={svgRef}
              width="100%"
              height="600px"
              className="border rounded-lg bg-slate-50"
            ></svg>
          </div>

          <div className="col-span-1">
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-sm font-medium text-gray-800">
                  {selectedNode ? selectedNode.name : 'Select a node for details'}
                </h3>
              </div>
              <div className="p-4">
                {selectedNode ? (
                  <div className="space-y-4">
                    <div>
                      <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${selectedNode.type === 'segment' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                        {selectedNode.type === 'segment' ? 'Segment' : 'Message Type'}
                      </span>
                      <p className="mt-2 text-sm text-gray-700">{selectedNode.description}</p>
                    </div>

                    {selectedNode.type === 'segment' && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-gray-700">Used in these message types:</h4>
                        <div className="max-h-[300px] overflow-y-auto">
                          <ul className="space-y-1">
                            {getMessageTypesForSegment(selectedNode.id).map(msgType => (
                              <li key={msgType.id} className="text-xs p-1 bg-slate-50 rounded">
                                {msgType.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'message' && selectedNode.segments && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 text-gray-700">Contains these segments:</h4>
                        <div className="max-h-[300px] overflow-y-auto">
                          <div className="flex flex-wrap gap-1">
                            {selectedNode.segments.map((segId) => {
                              const seg = allSegments.find(s => s.id === segId);
                              return (
                                <span
                                  key={segId}
                                  className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {segId} - {seg?.name || ''}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-center text-gray-500">
                    <div>
                      <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Click on a node in the graph to see details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-sm font-medium text-gray-800">Legend</h3>
              </div>
              <div className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-xs">Segment</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-300 mr-2"></div>
                    <span className="text-xs">Message Type</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Larger segment nodes appear in more message types</li>
                      <li>Click and drag nodes to reposition</li>
                      <li>Click a node to see its connections and details</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Snippet Section - Only visible when a segment is selected */}
            {selectedNode && selectedNode.type === 'segment' && (
              <div className="mt-4 bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="text-sm font-medium text-gray-800">Rhapsody Integration Code</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold mb-2 text-gray-700">Fetch value from {selectedNode.id}</h4>
                      <pre className="bg-gray-800 text-gray-100 p-3 rounded-md text-xs overflow-x-auto whitespace-pre">
                        {`// Example for ${selectedNode.id}-3 ${selectedNode.id === 'PID' ? '(Patient ID)' : ''}
function get${selectedNode.id}Value(message) {
${selectedNode.id === 'PID' ? `  // Get all PID-3 identifiers
  var identifiers = message.getSegment("PID").getField(3);
  
  // Look for Medicare number (type "MC")
  for (var i = 0; i < identifiers.size(); i++) {
    var idType = identifiers.get(i).getComponent(5).toString();
    if (idType === "MC") {
      return identifiers.get(i).getComponent(1).toString();
    }
  }
  return null; // No Medicare number found` : `  var segment = message.getSegment("${selectedNode.id}");
  if (segment) {
    return segment.getField(3).toString();
  }
  return null; // Segment not found or field is empty`}
}`}
                      </pre>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold mb-2 text-gray-700">Transform value in {selectedNode.id}</h4>
                      <pre className="bg-gray-800 text-gray-100 p-3 rounded-md text-xs overflow-x-auto whitespace-pre">
                        {`// Example for ${selectedNode.id}-3 ${selectedNode.id === 'PID' ? '(Patient ID)' : ''}
function transform${selectedNode.id}(message) {
${selectedNode.id === 'PID' ? `  // Get the PID segment
  var pidSegment = message.getSegment("PID");
  if (!pidSegment) return message;
  
  // Get all PID-3 identifiers
  var identifiers = pidSegment.getField(3);
  
  // Process Medicare numbers (type "MC")
  for (var i = 0; i < identifiers.size(); i++) {
    var identifier = identifiers.get(i);
    var idType = identifier.getComponent(5).toString();
    
    if (idType === "MC") {
      // Get the Medicare number
      var mcNumber = identifier.getComponent(1).toString();
      
      // Apply transformation (e.g., format to standard pattern)
      if (mcNumber && mcNumber.length === 10) {
        // Format as XXX-XX-XXXX
        var formattedNumber = mcNumber.substring(0, 3) + "-" +
                             mcNumber.substring(3, 5) + "-" +
                             mcNumber.substring(5);
        
        // Update the value
        identifier.getComponent(1).setValue(formattedNumber);
      }
    }
  }
  
  return message;` : `  var segment = message.getSegment("${selectedNode.id}");
  if (!segment) return message;
  
  // Get the value from field 3
  var fieldValue = segment.getField(3).toString();
  
  // Apply transformation logic
  if (fieldValue) {
    // Example transformation - uppercase the value
    var transformedValue = fieldValue.toUpperCase();
    
    // Update the field with transformed value
    segment.getField(3).setValue(transformedValue);
  }
  
  return message;`}
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default HL7SegmentMapper;