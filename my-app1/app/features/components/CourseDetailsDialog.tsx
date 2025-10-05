'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Course, Catalog } from '../schema/catalog-schema';
import { getDependentCourses, getPrerequisiteCourses } from '../actions/graph-utils';
import { Edge } from '@xyflow/react';

interface CourseDetailsDialogProps {
  course: Course | null;
  catalog: Catalog | null;
  edges: Edge[];
  isOpen: boolean;
  onClose: () => void;
  onCourseClick: (courseId: string) => void;
}

export function CourseDetailsDialog({
  course,
  catalog,
  edges,
  isOpen,
  onClose,
  onCourseClick,
}: CourseDetailsDialogProps) {
  if (!course || !catalog) return null;

  const prerequisites = getPrerequisiteCourses(course.id, edges);
  const dependents = getDependentCourses(edges, course.id);

  const getCourseById = (id: string) => catalog.courses.find(c => c.id === id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{course.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Badges */}
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

          {/* Course ID and Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Course ID</label>
              <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-sm">
                {course.id}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Academic Level</label>
              <div className="mt-1 p-2 bg-gray-100 rounded text-sm">
                {course.year}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">{course.description}</p>
          </div>

          {/* Prerequisites */}
          {prerequisites.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Prerequisites</h3>
              <div className="flex flex-wrap gap-2">
                {prerequisites.map((prereqId) => {
                  const prereqCourse = getCourseById(prereqId);
                  return (
                    <Badge
                      key={prereqId}
                      className="bg-yellow-100 text-yellow-800 border-yellow-300 cursor-pointer hover:bg-yellow-200"
                      onClick={() => onCourseClick(prereqId)}
                    >
                      {prereqCourse?.name || prereqId}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dependent Courses */}
          {dependents.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Required For</h3>
              <div className="flex flex-wrap gap-2">
                {dependents.map((dependentId) => {
                  const dependentCourse = getCourseById(dependentId);
                  return (
                    <Badge
                      key={dependentId}
                      className="bg-blue-100 text-blue-800 border-blue-300 cursor-pointer hover:bg-blue-200"
                      onClick={() => onCourseClick(dependentId)}
                    >
                      {dependentCourse?.name || dependentId}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Information */}
          {(course.corequisites?.length || course.requiredKnowledge?.length || course.notes) && (
            <div className="space-y-4">
              {course.corequisites && course.corequisites.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Corequisites</h3>
                  <div className="flex flex-wrap gap-2">
                    {course.corequisites.map((coreqId) => {
                      const coreqCourse = getCourseById(coreqId);
                      return (
                        <Badge key={coreqId} variant="outline">
                          {coreqCourse?.name || coreqId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {course.requiredKnowledge && course.requiredKnowledge.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Required Knowledge</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {course.requiredKnowledge.map((knowledge, index) => (
                      <li key={index} className="text-gray-700">{knowledge}</li>
                    ))}
                  </ul>
                </div>
              )}

              {course.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="text-gray-700">{course.notes}</p>
                </div>
              )}

              {course.alternativePrerequisites && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Alternative Prerequisites</h3>
                  <p className="text-gray-700">{course.alternativePrerequisites}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}