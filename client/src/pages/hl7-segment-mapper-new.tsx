import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { 
  ZoomIn, 
  ZoomOut, 
  RefreshCw, 
  Info, 
  Filter,
  Search,
  X 
} from 'lucide-react';

// Define the data structures
interface Segment {
  id: string;
  name: string;
  description: string;
}

interface MessageType {
  id: string;
  name: string;
  expanded?: boolean;
  segments: string[];
}

// Define GraphNode extending SimulationNodeDatum for D3 force simulation
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'segment' | 'message';
  description?: string;
  segments?: string[];
  group: number;
  value: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
}

const HL7SegmentMapper: React.FC = () => {
  // Define common HL7 message types
  const messageTypes: MessageType[] = [
    {
      id: 'ADT',
      name: 'ADT (Admission, Discharge, Transfer)',
      segments: ['MSH', 'EVN', 'PID', 'PD1', 'NK1', 'PV1', 'PV2', 'DB1', 'OBX', 'AL1', 'DG1', 'PR1', 'GT1', 'IN1', 'IN2', 'ROL', 'ACC', 'UB1', 'UB2']
    },
    {
      id: 'ORU',
      name: 'ORU (Observation Result)',
      segments: ['MSH', 'PID', 'PD1', 'NK1', 'NTE', 'PV1', 'PV2', 'ORC', 'OBR', 'NTE', 'OBX', 'CTI', 'SPM', 'FT1']
    },
    {
      id: 'ORM',
      name: 'ORM (Order Message)',
      segments: ['MSH', 'PID', 'PD1', 'PV1', 'PV2', 'IN1', 'IN2', 'GT1', 'AL1', 'ORC', 'OBR', 'RQD', 'RQ1', 'RXO', 'ODS', 'ODT', 'NTE', 'CTD', 'DG1', 'OBX']
    },
    {
      id: 'SIU',
      name: 'SIU (Scheduling Information Unsolicited)',
      segments: ['MSH', 'SCH', 'NTE', 'PID', 'PD1', 'PV1', 'PV2', 'OBX', 'DG1', 'RGS', 'AIS', 'AIG', 'AIL', 'AIP', 'APR']
    },
    {
      id: 'MDM',
      name: 'MDM (Medical Document Management)',
      segments: ['MSH', 'EVN', 'PID', 'PV1', 'TXA', 'OBX']
    },
    {
      id: 'BAR',
      name: 'BAR (Billing Account Record)',
      segments: ['MSH', 'EVN', 'PID', 'PV1', 'DG1', 'PR1', 'GT1', 'IN1', 'IN2', 'ACC', 'UB1', 'UB2']
    },
    {
      id: 'DFT',
      name: 'DFT (Detailed Financial Transaction)',
      segments: ['MSH', 'EVN', 'PID', 'PV1', 'PV2', 'DB1', 'OBX', 'FT1', 'DG1', 'PR1', 'GT1', 'IN1', 'IN2', 'ROL']
    },
    {
      id: 'RDE',
      name: 'RDE (Pharmacy Encoded Order)',
      segments: ['MSH', 'PID', 'PD1', 'NTE', 'PV1', 'PV2', 'IN1', 'IN2', 'GT1', 'AL1', 'ORC', 'RXE', 'RXR', 'RXC', 'OBX', 'NTE', 'CTI']
    }
  ];

  // Define all common HL7 segments
  const allSegments: Segment[] = [
    { id: 'MSH', name: 'Message Header', description: 'Contains information about the message itself' },
    { id: 'PID', name: 'Patient Identification', description: 'Contains patient demographic information' },
    { id: 'PV1', name: 'Patient Visit', description: 'Contains information about the patient visit' },
    { id: 'ORC', name: 'Common Order', description: 'Contains common order information' },
    { id: 'OBR', name: 'Observation Request', description: 'Contains information about an observation request' },
    { id: 'OBX', name: 'Observation Result', description: 'Contains observation result information' },
    { id: 'EVN', name: 'Event Type', description: 'Contains event type information' },
    { id: 'NTE', name: 'Notes and Comments', description: 'Contains notes and comments' },
    { id: 'AL1', name: 'Patient Allergy Information', description: 'Contains patient allergy information' },
    { id: 'DG1', name: 'Diagnosis', description: 'Contains diagnosis information' },
    { id: 'PD1', name: 'Patient Additional Demographic', description: 'Contains additional demographic info' },
    { id: 'NK1', name: 'Next of Kin', description: 'Contains information about patient\'s next of kin' },
    { id: 'PV2', name: 'Patient Visit - Additional Info', description: 'Contains additional visit information' },
    { id: 'IN1', name: 'Insurance', description: 'Contains insurance information' },
    { id: 'IN2', name: 'Insurance Additional Info', description: 'Contains additional insurance information' },
    { id: 'GT1', name: 'Guarantor', description: 'Contains guarantor information' },
    { id: 'PR1', name: 'Procedures', description: 'Contains procedure information' },
    { id: 'ROL', name: 'Role', description: 'Contains information about a person\'s role' },
    { id: 'FT1', name: 'Financial Transaction', description: 'Contains financial transaction information' },
    { id: 'SCH', name: 'Scheduling Activity', description: 'Contains scheduling information' },
    { id: 'RGS', name: 'Resource Group', description: 'Contains resource group information' },
    { id: 'AIS', name: 'Appointment Information - Service', description: 'Contains appointment service information' },
    { id: 'AIG', name: 'Appointment Information - General Resource', description: 'Contains general resource information' },
    { id: 'AIL', name: 'Appointment Information - Location Resource', description: 'Contains location resource information' },
    { id: 'AIP', name: 'Appointment Information - Personnel Resource', description: 'Contains personnel resource information' },
    { id: 'APR', name: 'Appointment Preferences', description: 'Contains appointment preferences' },
    { id: 'TXA', name: 'Document Notification', description: 'Contains document notification information' },
    { id: 'RXE', name: 'Pharmacy Encoded Order', description: 'Contains pharmacy encoded order information' },
    { id: 'RXR', name: 'Pharmacy Route', description: 'Contains pharmacy route information' },
    { id: 'RXC', name: 'Pharmacy Component Order', description: 'Contains pharmacy component order information' },
    { id: 'CTI', name: 'Clinical Trial Identification', description: 'Contains clinical trial identification' },
    { id: 'SPM', name: 'Specimen', description: 'Contains specimen information' },
    { id: 'DB1', name: 'Disability', description: 'Contains disability information' },
    { id: 'ACC', name: 'Accident', description: 'Contains accident information' },
    { id: 'UB1', name: 'UB82 Data', description: 'Contains UB82 data' },
    { id: 'UB2', name: 'UB92 Data', description: 'Contains UB92 data' },
    { id: 'RQD', name: 'Requisition Detail', description: 'Contains requisition detail' },
    { id: 'RQ1', name: 'Requisition Detail-1', description: 'Contains requisition detail 1' },
    { id: 'RXO', name: 'Pharmacy/Treatment Order', description: 'Contains pharmacy/treatment order' },
    { id: 'ODS', name: 'Dietary Orders, Supplements, and Preferences', description: 'Contains dietary orders' },
    { id: 'ODT', name: 'Diet Tray Instructions', description: 'Contains diet tray instructions' },
    { id: 'CTD', name: 'Contact Data', description: 'Contains contact data' }
  ];

  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterValue, setFilterValue] = useState<number>(0); // 0 means no filter
  const [graphData, setGraphData] = useState<{nodes: GraphNode[], links: GraphLink[]}>({nodes: [], links: []});
  const [currentZoom, setCurrentZoom] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchType, setSearchType] = useState<'all' | 'segments' | 'messages'>('all');
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  
  // Function to calculate which message types contain a segment
  const getMessageTypesForSegment = (segmentId: string) => {
    return messageTypes.filter(type => type.segments.includes(segmentId));
  };

  // Search functionality
  const performSearch = (term: string, type: 'all' | 'segments' | 'messages') => {
    if (!term.trim()) {
      setHighlightedNodes(new Set());
      return;
    }

    const highlighted = new Set<string>();
    const searchLower = term.toLowerCase();

    if (type === 'all' || type === 'segments') {
      allSegments.forEach(segment => {
        if (
          segment.id.toLowerCase().includes(searchLower) ||
          segment.name.toLowerCase().includes(searchLower) ||
          segment.description.toLowerCase().includes(searchLower)
        ) {
          highlighted.add(segment.id);
        }
      });
    }

    if (type === 'all' || type === 'messages') {
      messageTypes.forEach(msgType => {
        if (
          msgType.id.toLowerCase().includes(searchLower) ||
          msgType.name.toLowerCase().includes(searchLower)
        ) {
          highlighted.add(msgType.id);
        }
      });
    }

    setHighlightedNodes(highlighted);
  };

  // Handle search changes
  useEffect(() => {
    performSearch(searchTerm, searchType);
  }, [searchTerm, searchType]);

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setHighlightedNodes(new Set());
  };
  
  // Prepare data for force-directed graph
  useEffect(() => {
    // Create nodes for segments and message types
    const segmentNodes: GraphNode[] = allSegments.map(segment => {
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
    
    const messageNodes: GraphNode[] = messageTypes.map(msgType => {
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
    const links: GraphLink[] = [];
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
      links
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
      
      const messageIdsInFilteredLinks = new Set<string>();
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
        setSelectedNode(null);
        resetHighlighting();
      });
    
    // Create a zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
        setCurrentZoom(event.transform.k);
      });
    
    // Apply zoom behavior to SVG
    svg.call(zoom);
    
    // Define simulation node and link types
    type SimNode = d3.SimulationNodeDatum & GraphNode;
    type SimLink = d3.SimulationLinkDatum<SimNode> & GraphLink;
    
    // Create a simulation for the force-directed graph
    const simulation = d3.forceSimulation<SimNode>()
      .nodes(filteredData.nodes as SimNode[])
      .force("link", d3.forceLink<SimNode, SimLink>()
        .id(d => d.id)
        .links(filteredData.links as SimLink[])
        .distance(100))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1));
    
    // Create links
    const link = container.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(filteredData.links as SimLink[])
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", d => Math.sqrt(d.value));
    
    // Create nodes
    const node = container.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(filteredData.nodes as SimNode[])
      .enter().append("g")
      .attr("class", "node")
      .call(d3.drag<SVGGElement, SimNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", (event, d) => {
        if (event) event.stopPropagation(); // Prevent the click from bubbling to the background
        setSelectedNode(d);
        highlightConnections(d);
      });
    
    // Add circles to nodes
    node.append("circle")
      .attr("r", d => d.type === 'segment' ? 8 + (d.value * 0.5) : 12)
      .attr("fill", d => {
        const isHighlighted = highlightedNodes.has(d.id);
        if (isHighlighted) {
          return d.type === 'segment' ? "#10b981" : "#f59e0b";
        }
        return d.type === 'segment' ? "#4299e1" : "#f6ad55";
      })
      .attr("stroke", d => highlightedNodes.has(d.id) ? "#065f46" : "#fff")
      .attr("stroke-width", d => highlightedNodes.has(d.id) ? 3 : 1.5);
    
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
          const source = d.source as SimNode;
          return source.x || 0;
        })
        .attr("y1", d => {
          const source = d.source as SimNode;
          return source.y || 0;
        })
        .attr("x2", d => {
          const target = d.target as SimNode;
          return target.x || 0;
        })
        .attr("y2", d => {
          const target = d.target as SimNode;
          return target.y || 0;
        });
      
      node.attr("transform", d => `translate(${d.x || 0}, ${d.y || 0})`);
    });
    
    function dragstarted(event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>, d: SimNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>, d: SimNode) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>, d: SimNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    function highlightConnections(d: SimNode) {
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
        const connectedNodeIds = new Set<string>();
        
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
  }, [graphData, filterValue, highlightedNodes]);
  
  // Helper functions for UI controls
  const handleZoomIn = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const currentTransform = d3.zoomTransform(svg.node() as Element);
    const newTransform = currentTransform.scale(1.2);
    
    svg.transition()
      .duration(300)
      .call(d3.zoom<SVGSVGElement, unknown>().transform as any, newTransform);
    
    setCurrentZoom(newTransform.k);
  };
  
  const handleZoomOut = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const currentTransform = d3.zoomTransform(svg.node() as Element);
    const newTransform = currentTransform.scale(0.8);
    
    svg.transition()
      .duration(300)
      .call(d3.zoom<SVGSVGElement, unknown>().transform as any, newTransform);
    
    setCurrentZoom(newTransform.k);
  };
  
  const handleReset = () => {
    if (!svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.transition()
      .duration(500)
      .call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
    
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
          {/* Search Controls */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search segments or message types..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Filter:</span>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value as 'all' | 'segments' | 'messages')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="segments">Segments Only</option>
                  <option value="messages">Messages Only</option>
                </select>
              </div>
              
              {highlightedNodes.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                    {highlightedNodes.size} found
                  </span>
                </div>
              )}
            </div>
            
            {searchTerm && highlightedNodes.size === 0 && (
              <div className="mt-3 text-sm text-gray-500">
                No matches found for "{searchTerm}"
              </div>
            )}
          </div>

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
              <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                filterValue > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
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
                        <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          selectedNode.type === 'segment' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HL7SegmentMapper;