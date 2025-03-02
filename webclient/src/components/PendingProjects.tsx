'use client';

import { useState, useEffect } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { FUND_ALLOCATION_ADDRESS } from '../../config/wagmi';
import { fundAllocationABI } from '@/contracts/abis';

interface Project {
  name: string;
  description: string;
  recipient: string;
  amount: bigint;
  timestamp: bigint;
  validations: bigint;
  completed: boolean;
  released: boolean;
}

export function PendingProjects() {
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const publicClient = usePublicClient();

  // Get total project count
  const { data: projectCount } = useReadContract({
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: fundAllocationABI,
    functionName: 'getProjectCount',
    query: { enabled: true }
  }) as { data: bigint | undefined };

  // Get all projects
  const fetchProjects = async () => {
    if (!projectCount) return;
    
    const projects: Project[] = [];
    for (let i = 0; i < Number(projectCount); i++) {
      try {
        const data = await publicClient?.readContract({
          address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
          abi: fundAllocationABI,
          functionName: 'getProject',
          args: [BigInt(i)]
        }) as Project;

        if (data && !data.completed) {
          projects.push(data);
        }
      } catch (error) {
        console.error(`Error fetching project ${i}:`, error);
      }
    }
    setPendingProjects(projects);
  };

  useEffect(() => {
    fetchProjects();
    
    // Refresh when new projects are added
    window.addEventListener('projectAdded', fetchProjects);
    return () => window.removeEventListener('projectAdded', fetchProjects);
  }, [projectCount]);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-bold text-white">Pending Projects</h2>
      </div>
      <div className="p-6 space-y-4 bg-gray-800">
        {pendingProjects.length > 0 ? (
          <div className="space-y-4">
            {pendingProjects.map((project, index) => (
              <div key={index} className="p-4 bg-gray-700 rounded-lg space-y-2">
                <h3 className="font-medium text-gray-200">Project #{index}</h3>
                <p className="text-sm text-gray-300">Name: {project.name}</p>
                <p className="text-sm text-gray-300">Description: {project.description}</p>
                <p className="text-sm text-gray-300">
                  Amount: {project.amount ? (Number(project.amount) / 1e18).toFixed(4) : 0} ETH
                </p>
                <p className="text-sm text-gray-300">
                  Validations: {project.validations?.toString() || '0'}
                </p>
                <div className="mt-2 h-2 bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ 
                      width: `${(Number(project.validations || 0) / 2) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No pending projects found</p>
        )}
      </div>
    </div>
  );
} 