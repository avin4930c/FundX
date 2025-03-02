'use client';

import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { FUND_ALLOCATION_ADDRESS } from '../../../config/wagmi';
import { fundAllocationABI } from '../../contracts/abis';
import { useContractRead } from '../../hooks/useContractRead';
import { usePublicClient } from 'wagmi';

interface Project {
  name: string;
  description: string;
  recipient: string;
  amount: bigint;
  timestamp: bigint;
  released: boolean;
  completed: boolean;
}

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [milestones, setMilestones] = useState<boolean[]>([]);

  const { data: projectsData } = useReadContract({
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: fundAllocationABI,
    functionName: 'getAllProjects',
  });

  const { writeContract } = useWriteContract();

  useEffect(() => {
    if (projectsData) {
      setProjects(projectsData as Project[]);
    }
  }, [projectsData]);

  const fetchMilestones = async (projectId: number) => {
    try {
      const client = usePublicClient();
      const data = await client?.readContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'getProjectMilestones',
        args: [BigInt(projectId)],
      });
      setMilestones(data as boolean[]);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    }
  };

  const handleCompleteMilestone = async (projectId: number, milestoneIndex: number) => {
    try {
      await writeContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'completeMilestone',
        args: [BigInt(projectId), BigInt(milestoneIndex)],
      });
      // Refresh milestones after completion
      fetchMilestones(projectId);
    } catch (error) {
      console.error('Error completing milestone:', error);
    }
  };

  const handleReleaseFunds = async (projectId: number) => {
    try {
      await writeContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'releaseFunds',
        args: [BigInt(projectId)],
      });
    } catch (error) {
      console.error('Error releasing funds:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-6">
      <h2 className="text-2xl font-bold mb-6">Projects</h2>
      
      {projects.length === 0 ? (
        <p className="text-center text-gray-500">No projects yet</p>
      ) : (
        <div className="space-y-6">
          {projects.map((project, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                  <p className="text-sm mt-2">
                    <span className="font-medium">Recipient:</span> {project.recipient}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Amount:</span> {formatEther(project.amount)} ETH
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Date:</span> {new Date(Number(project.timestamp) * 1000).toLocaleString()}
                  </p>
                  <div className="mt-2 flex space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${project.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {project.completed ? 'Completed' : 'In Progress'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${project.released ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {project.released ? 'Funds Released' : 'Funds Held'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => {
                    setSelectedProject(selectedProject === index ? null : index);
                    if (selectedProject !== index) {
                      fetchMilestones(index);
                    }
                  }}
                  className="text-blue-600 text-sm hover:underline"
                >
                  {selectedProject === index ? 'Hide Details' : 'Show Details'}
                </button>
                
                {selectedProject === index && (
                  <div className="mt-4 space-y-4">
                    <h4 className="font-medium">Milestones</h4>
                    <div className="space-y-2">
                      {milestones.map((completed, mIndex) => (
                        <div key={mIndex} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-2 ${completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span>Milestone {mIndex + 1}</span>
                          </div>
                          {!completed && (
                            <button
                              onClick={() => handleCompleteMilestone(index, mIndex)}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {project.completed && !project.released && (
                      <button
                        onClick={() => handleReleaseFunds(index)}
                        className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                      >
                        Release Funds
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 