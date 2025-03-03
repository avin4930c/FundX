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

interface ProjectResult {
  0: string;   // name
  1: string;   // description
  2: string;   // recipient
  3: bigint;   // amount
  4: bigint;   // timestamp
  5: boolean;  // released
  6: boolean;  // completed
  7: bigint;   // validations
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
    if (!projectCount) {
      console.log('No projects found - project count is undefined');
      return;
    }

    console.log('Fetching projects. Total count:', projectCount.toString());
    const projects: Project[] = [];
    for (let i = 0; i < Number(projectCount); i++) {
      try {
        console.log(`Fetching project ${i}...`);
        const result = (await publicClient?.readContract({
          address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
          abi: fundAllocationABI,
          functionName: 'getProject',
          args: [BigInt(i)]
        })) as ProjectResult;

        // Log the raw result
        console.log(`Raw project ${i} data:`, result);

        // Convert the result to our Project type
        const data = {
          name: result[0],
          description: result[1],
          recipient: result[2],
          amount: result[3],
          timestamp: result[4],
          released: result[5],
          completed: result[6],
          validations: result[7]
        } as Project;

        console.log(`Processed project ${i} data:`, {
          name: data.name,
          released: data.released,
          completed: data.completed,
          amount: data.amount.toString(),
          validations: data.validations.toString()
        });

        // Temporarily show all projects for debugging
        console.log(`Adding project ${i} to list (showing all for debugging)`);
        projects.push(data);

        // Log project status
        console.log(`Project ${i} status:`, {
          name: data.name,
          released: data.released,
          completed: data.completed,
          validations: data.validations.toString(),
          amount: (Number(data.amount) / 1e18).toFixed(4) + ' ETH'
        });

      } catch (error) {
        console.error(`Error fetching project ${i}:`, error);
      }
    }
    console.log('Total projects found:', projects.length);
    setPendingProjects(projects);
  };

  useEffect(() => {
    console.log('PendingProjects useEffect triggered - fetching projects');
    fetchProjects();

    // Set up event listeners for contract events
    const handleProjectAdded = () => {
      console.log('Project added event received - refreshing list');
      fetchProjects();
    };

    const handleTransactionMined = () => {
      console.log('Transaction mined - refreshing list');
      fetchProjects();
    };

    // Listen for both manual refresh events and transaction completion
    window.addEventListener('projectAdded', handleProjectAdded);
    window.addEventListener('transactionMined', handleTransactionMined);

    return () => {
      window.removeEventListener('projectAdded', handleProjectAdded);
      window.removeEventListener('transactionMined', handleTransactionMined);
    };
  }, [projectCount, publicClient]);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-bold text-white">All Projects (Debug Mode)</h2>
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
                <p className="text-sm text-gray-300">
                  Status: {project.completed ? 'Completed' : project.released ? 'Released' : 'Pending'}
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
          <p className="text-gray-400">No projects found</p>
        )}
      </div>
    </div>
  );
} 