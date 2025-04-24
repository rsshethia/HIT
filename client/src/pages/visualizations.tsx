import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import D3PieChart from '../components/d3-pie-chart';
import D3BarChart from '../components/d3-bar-chart';
import D3RadarChart from '../components/d3-radar-chart';

export default function VisualizationsPage() {
  const [activeTab, setActiveTab] = useState('pie');

  // Pie chart sample data
  const pieChartData = [
    { name: 'Connectivity', value: 8, color: '#3b82f6' },
    { name: 'Data Standards', value: 6, color: '#10b981' },
    { name: 'Security', value: 9, color: '#f97316' },
    { name: 'Monitoring', value: 4, color: '#6366f1' },
    { name: 'Support', value: 7, color: '#ec4899' },
  ];

  // Bar chart sample data
  const barChartData = [
    { label: 'PAS', value: 28, color: '#3b82f6' },
    { label: 'EHR', value: 45, color: '#10b981' },
    { label: 'LIS', value: 18, color: '#f97316' },
    { label: 'RIS', value: 22, color: '#6366f1' },
    { label: 'Billing', value: 35, color: '#ec4899' },
    { label: 'Pharmacy', value: 30, color: '#84cc16' },
  ];

  // Radar chart sample data
  const radarChartData = [
    { axis: 'Interoperability', value: 8 },
    { axis: 'Design', value: 7 },
    { axis: 'Governance', value: 5 },
    { axis: 'Security', value: 9 },
    { axis: 'Data Standards', value: 6 },
    { axis: 'Testing', value: 7 },
    { axis: 'Support', value: 8 },
  ];

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8">D3.js Data Visualizations</h2>
          <p className="text-lg text-gray-600 mb-6">
            Interactive visualizations to help understand healthcare integration data. These components
            use D3.js to create dynamic, responsive charts that can be used throughout the application.
          </p>
          
          <div className="mb-12">
            <Link href="/resources">
              <Button variant="outline" className="inline-flex items-center w-full sm:w-auto">
                <span className="material-icons mr-1 text-sm">arrow_back</span>
                Back to Resources
              </Button>
            </Link>
          </div>

          <Tabs defaultValue="pie" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="pie">Pie Chart</TabsTrigger>
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
              <TabsTrigger value="radar">Radar Chart</TabsTrigger>
            </TabsList>

            <TabsContent value="pie" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pie Chart Visualization</CardTitle>
                  <CardDescription>
                    Displays categorical data as proportional segments of a circle. Useful for showing percentage 
                    or proportional data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                  <div className="w-full max-w-2xl">
                    <D3PieChart 
                      data={pieChartData} 
                      title="Integration Domain Scores" 
                      width={500} 
                      height={500}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Use Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc ml-6 space-y-2">
                    <li>Displaying assessment scores by domain</li>
                    <li>Showing distribution of integration types across systems</li>
                    <li>Visualizing message volume distribution by message type</li>
                    <li>Representing composition of integration architecture</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bar Chart Visualization</CardTitle>
                  <CardDescription>
                    Displays categorical data with rectangular bars. Good for comparing quantities 
                    across different categories.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                  <div className="w-full max-w-3xl">
                    <D3BarChart 
                      data={barChartData} 
                      title="Message Volume by System" 
                      xAxisLabel="Systems" 
                      yAxisLabel="Messages per hour"
                      width={700} 
                      height={500}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Use Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc ml-6 space-y-2">
                    <li>Comparing integration maturity scores across domains</li>
                    <li>Tracking message volumes by system</li>
                    <li>Analyzing integration errors by source</li>
                    <li>Visualizing downtime metrics across systems</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="radar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Radar Chart Visualization</CardTitle>
                  <CardDescription>
                    Displays multivariate data as a two-dimensional chart with quantitative variables on axes 
                    starting from the same point. Perfect for maturity assessments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                  <div className="w-full max-w-2xl">
                    <D3RadarChart 
                      data={radarChartData} 
                      title="Integration Maturity by Domain" 
                      width={600} 
                      height={500}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Use Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc ml-6 space-y-2">
                    <li>Displaying comprehensive maturity assessment results</li>
                    <li>Comparing maturity across multiple domains</li>
                    <li>Showing integration capabilities across different dimensions</li>
                    <li>Visualizing compliance with standards across categories</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-12 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Integration with Assessment Results</h3>
            <p className="mb-4">
              These D3.js components can be integrated with the assessment tool to provide visual feedback on maturity
              scores and help organizations understand their integration strengths and weaknesses at a glance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/assessment">
                <Button className="w-full sm:w-auto">
                  <span className="material-icons mr-2">assessment</span>
                  Start Assessment
                </Button>
              </Link>
              <Link href="/results">
                <Button variant="outline" className="w-full sm:w-auto">
                  <span className="material-icons mr-2">bar_chart</span>
                  View Sample Results
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}