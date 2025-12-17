import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAllProjects, fetchEmployees, assignProject } from '../services/taskService';
import { Briefcase, User, Edit2 } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    assigned_employee_id: string | null;
    assigned_employee?: {
        full_name: string;
        email: string;
    } | null;
}

interface Employee {
    id: string;
    full_name: string;
    email: string;
}

const Projects: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'manager';

    const [projects, setProjects] = useState<Project[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Assignment Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [projs, emps] = await Promise.all([
                fetchAllProjects(),
                fetchEmployees()
            ]);
            setProjects(projs);
            setEmployees(emps);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load projects.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            loadData();
        }
    }, [user, isAdmin]);

    const openAssignModal = (project: Project) => {
        setSelectedProject(project);
        setSelectedEmployeeId(project.assigned_employee_id || "");
        setIsModalOpen(true);
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProject) return;

        try {
            await assignProject(selectedProject.id, selectedEmployeeId || null);
            setIsModalOpen(false);
            loadData(); // Reload to show new assignment
        } catch (err) {
            console.error("Assignment failed", err);
            alert("Failed to update assignment");
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-96 text-gray-500">
                <p>Access restricted. Admins only.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1DCD9C]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Project Assignments</h2>
                    <p className="text-gray-400 text-sm">Assign projects to employees.</p>
                </div>
            </div>

            {error && <p className="text-red-400">{error}</p>}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <div key={project.id} className="bg-[#222] border border-gray-800 p-5 rounded-xl flex flex-col justify-between">
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Briefcase size={20} className="text-[#1DCD9C]" />
                                <h3 className="text-lg font-semibold text-white truncate">{project.name}</h3>
                            </div>

                            <div className="bg-[#111] p-3 rounded-lg border border-gray-800">
                                <p className="text-xs text-gray-500 uppercase font-mono mb-1">Assigned To</p>
                                {project.assigned_employee ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                        <User size={14} />
                                        <span>{project.assigned_employee.full_name}</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-yellow-500/80 italic">Unassigned</p>
                                )}
                                {project.assigned_employee?.email && (
                                    <p className="text-xs text-gray-600 ml-6">{project.assigned_employee.email}</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => openAssignModal(project)}
                            className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors text-sm"
                        >
                            <Edit2 size={16} /> Change Assignment
                        </button>
                    </div>
                ))}
            </div>

            {/* Assignment Modal */}
            {isModalOpen && selectedProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Assign Project: {selectedProject.name}</h3>

                        <form onSubmit={handleAssign} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Select Employee</label>
                                <select
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                    className="w-full p-2 rounded bg-[#0f0f0f] text-white border border-gray-700 focus:border-[#1DCD9C] outline-none"
                                >
                                    <option value="">-- Unassigned --</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.full_name} ({emp.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded bg-gray-700 text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded bg-[#1DCD9C] text-black font-semibold"
                                >
                                    Save Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
