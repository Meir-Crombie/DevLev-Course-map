'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  useReactFlow,
  ReactFlowProvider,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, Upload, Info } from 'lucide-react';
import { Catalog, Course } from './features/schema/catalog-schema';
import { buildGraph, layoutElements, hasCycle, getDependentCourses, getPrerequisiteCourses } from './features/actions/graph-utils';
import { CourseNode } from './features/components/CourseNode';
import { CourseDetailsDialog } from './features/components/CourseDetailsDialog';

const nodeTypes = {
  courseNode: CourseNode,
};

function CourseCatalogApp() {
  // State management
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [metadataCollapsed, setMetadataCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasCycleError, setHasCycleError] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { fitView, zoomTo } = useReactFlow();

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Set mounted state to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Build graph when catalog changes
  useEffect(() => {
    if (catalog) {
      try {
        const graphData = buildGraph(catalog);
        const positionedNodes = layoutElements(graphData.nodes, graphData.edges, 'TB');

        // Filter visible nodes and edges based on expansion state
        const visibleNodeIds = getVisibleNodeIds(catalog, expandedCourses, graphData.edges);
        const visibleNodes = positionedNodes.filter(node => visibleNodeIds.has(node.id));
        const visibleEdges = graphData.edges.filter(edge =>
          visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
        );

        // @ts-expect-error - React Flow typing complexity
        setNodes(visibleNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onDialogOpen: handleDialogOpen,
          },
        })));
        // @ts-expect-error - React Flow typing complexity
        setEdges(visibleEdges);

        // Fit view after a short delay to ensure rendering
        setTimeout(() => fitView({ padding: 0.2 }), 100);
      } catch (err) {
        console.error('Error building graph:', err);
        setError('Failed to build course graph');
      }
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [catalog, expandedCourses, fitView]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get visible node IDs based on expansion state
  const getVisibleNodeIds = useCallback((catalog: Catalog, expanded: Set<string>, edges: Edge[]) => {
    const visible = new Set<string>();

    // Add all root courses (courses with no prerequisites)
    catalog.courses.forEach(course => {
      if (!course.prerequisites || course.prerequisites.length === 0) {
        visible.add(course.id);
      }
    });

    // Add expanded courses and their prerequisites/dependencies
    expanded.forEach(courseId => {
      visible.add(courseId);

      // Add prerequisites
      const prereqs = getPrerequisiteCourses(courseId, edges);
      prereqs.forEach(prereq => visible.add(prereq));

      // Add dependents
      const dependents = getDependentCourses(edges, courseId);
      dependents.forEach(dep => visible.add(dep));
    });

    return visible;
  }, []);

  // Handle file import
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    setHasCycleError(false);

    try {
      const text = await file.text();
      const parsedCatalog = JSON.parse(text);

      // Validate with Zod schema
      const { CatalogSchema } = await import('./features/schema/catalog-schema');
      const validatedCatalog = CatalogSchema.parse(parsedCatalog);

      // Check for cycles
      const graphData = buildGraph(validatedCatalog);
      if (hasCycle(graphData.edges)) {
        setHasCycleError(true);
        setError('Cycle detected in prerequisite graph! Cannot import catalog.');
        return;
      }

      setCatalog(validatedCatalog);
      setExpandedCourses(new Set()); // Reset expansion state
      setSuccess(`Successfully imported ${validatedCatalog.courses.length} courses`);
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import catalog');
    } finally {
      setLoading(false);
    }
  };

  // Handle course selection
  const handleCourseSelect = useCallback((courseId: string) => {
    const course = catalog?.courses.find(c => c.id === courseId);
    if (course) {
      setSelectedCourse(course);
      // Center and zoom to the course
      // @ts-expect-error - React Flow typing complexity
      const node = nodes.find(n => n.id === courseId);
      if (node) {
        // @ts-expect-error - React Flow typing complexity
        zoomTo(1.5, { x: node.position.x + 120, y: node.position.y + 42 });
      }
    }
  }, [catalog, nodes, zoomTo]);

  // Handle dialog open
  const handleDialogOpen = useCallback((courseId: string) => {
    const course = catalog?.courses.find(c => c.id === courseId);
    if (course) {
      setSelectedCourse(course);
      setDialogOpen(true);
    }
  }, [catalog]);

  // Handle course expansion
  const handleCourseExpansion = useCallback((courseId: string) => {
    setExpandedCourses(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(courseId)) {
        newExpanded.delete(courseId);
      } else {
        newExpanded.add(courseId);
      }
      return newExpanded;
    });
  }, []);

  // Filter courses for search
  const filteredCourses = useMemo(() => {
    if (!catalog) return [];
    if (!searchQuery) return catalog.courses;

    return catalog.courses.filter(course =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [catalog, searchQuery]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b p-4 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80"
            />
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                id="file-input"
              />
              <Button asChild>
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Import JSON
                </label>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {loading && <span className="text-blue-600">Loading...</span>}
            {error && <span className="text-red-600">{error}</span>}
            {success && <span className="text-green-600">{success}</span>}
            {hasCycleError && <span className="text-red-600 font-bold">Cycle detected!</span>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="map" className="h-full flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="map">Course Map</TabsTrigger>
            <TabsTrigger value="list">Course List</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="flex-1 m-0">
            <div className="h-full flex">
              {/* Sidebar */}
              <div className="w-80 border-r bg-gray-50 p-4">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {catalog?.courses.map((course) => (
                      <Card
                        key={course.id}
                        className={`p-3 cursor-pointer transition-colors ${
                          selectedCourse?.id === course.id ? 'bg-blue-50 border-blue-300' : ''
                        } ${course.mandatory ? 'border-blue-200' : ''}`}
                        onClick={() => handleCourseSelect(course.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`font-semibold text-sm ${course.mandatory ? 'font-bold' : ''}`}>
                              {course.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              {course.credits && (
                                <Badge variant="secondary" className="text-xs">
                                  {course.credits}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {course.semester}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCourseExpansion(course.id);
                            }}
                          >
                            {expandedCourses.has(course.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Graph */}
              <div className="flex-1">
                {/* Metadata Section */}
                {catalog?.metadata && (
                  <div className="bg-gray-100 p-4 border-b">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMetadataCollapsed(!metadataCollapsed)}
                      className="mb-2"
                    >
                      {metadataCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      Metadata
                    </Button>
                    {!metadataCollapsed && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {catalog.metadata.lastUpdated && (
                          <div>
                            <span className="font-medium">Last Updated:</span> {catalog.metadata.lastUpdated}
                          </div>
                        )}
                        {catalog.metadata.department && (
                          <div>
                            <span className="font-medium">Department:</span> {catalog.metadata.department}
                          </div>
                        )}
                        {catalog.metadata.totalCourses && (
                          <div>
                            <span className="font-medium">Total Courses:</span> {catalog.metadata.totalCourses}
                          </div>
                        )}
                        {catalog.metadata.notes && catalog.metadata.notes.length > 0 && (
                          <div className="col-span-full">
                            <span className="font-medium">Notes:</span>
                            <ul className="list-disc list-inside mt-1">
                              {catalog.metadata.notes.map((note, index) => (
                                <li key={index}>{note}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* React Flow */}
                <div className="h-full">
                  {mounted ? (
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      nodeTypes={nodeTypes}
                      fitView
                      className="bg-gray-50"
                    >
                      <Controls />
                      <MiniMap />
                      <Background />
                    </ReactFlow>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <div className="text-gray-500">Loading course map...</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" className="flex-1 m-0 p-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4">Course Catalog</h1>
                <p className="text-gray-600 text-lg">
                  Browse our comprehensive selection of courses across all years and semesters
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <Card
                    key={course.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleDialogOpen(course.id)}
                  >
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold">{course.name}</h3>

                      <div className="flex flex-wrap gap-2">
                        {course.credits && (
                          <Badge className="bg-blue-600">
                            {course.credits} credits
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {course.mandatory ? 'Required' : 'Elective'}
                        </Badge>
                        <Badge variant="outline">{course.year}</Badge>
                        <Badge variant="outline">{course.semester}</Badge>
                      </div>

                      <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                        {course.description}
                      </p>

                      <Button className="w-full" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Course Details Dialog */}
      <CourseDetailsDialog
        course={selectedCourse}
        catalog={catalog}
        edges={edges}
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCourseClick={(courseId) => {
          setDialogOpen(false);
          setTimeout(() => handleDialogOpen(courseId), 100);
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <CourseCatalogApp />
    </ReactFlowProvider>
  );
}
