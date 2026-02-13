import { useState } from 'react';
import { ProjectFolderPicker } from '../features/projects/components/ProjectFolderPicker';

export function ProjectsPage() {
  const [showAddProject, setShowAddProject] = useState(false);
  const [projects, setProjects] = useState<Array<{ name: string; path: string }>>([
    { name: 'Example Project', path: '/Users/example/projects/example' },
  ]);

  const handleSelectPath = async (path: string) => {
    // TODO: Call backend API to validate and create project
    console.log('Selected path:', path);

    // For demo, just add it to the list
    const projectName = path.split('/').pop() || 'New Project';
    setProjects([...projects, { name: projectName, path }]);
    setShowAddProject(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Projects</h2>
          <button
            onClick={() => setShowAddProject(!showAddProject)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showAddProject ? 'Cancel' : '+ Add Project'}
          </button>
        </div>

        {showAddProject && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Add New Project</h3>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                ✨ <strong>New Feature!</strong> Native folder picker (Chrome/Edge) or manual input (all browsers)
              </p>
            </div>

            <ProjectFolderPicker onSelect={handleSelectPath} />
          </div>
        )}

        {/* Projects List */}
        <div className="space-y-3">
          {projects.map((project, idx) => (
            <div
              key={idx}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{project.path}</p>
                </div>
                <button className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded">
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && !showAddProject && (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg">No projects yet</p>
            <p className="text-sm mt-2">Click "Add Project" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
