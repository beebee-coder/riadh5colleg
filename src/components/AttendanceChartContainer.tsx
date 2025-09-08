// src/components/AttendanceChartContainer.tsx
'use client';

import Image from "next/image";
import AttendanceChart from "./AttendanceChart";
import { daysOfWeek } from "@/lib/constants";
import { useEffect, useState } from "react";

// Specific type for the data fetched from Prisma
type AttendanceData = {
  name: string;
  present: number;
  absent: number;
};

// Client Component to display the chart
const AttendanceChartContainer = () => {
  const [chartData, setChartData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetching data from an API route instead of directly using Prisma
        const response = await fetch('/api/attendance/weekly-summary');
        if (!response.ok) {
          throw new Error('Failed to fetch attendance data');
        }
        const data = await response.json();
        setChartData(data);
      } catch (error) {
        console.error("❌ [AttendanceChartContainer] Erreur lors de la récupération des données de présence:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  if (loading) {
    return <div className="bg-muted p-4 rounded-lg h-full flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="bg-muted p-4 rounded-lg h-full">
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold text-foreground">Présence</h1>
        <Image src="https://placehold.co/20x20.png" alt="more options" width={20} height={20} data-ai-hint="more options dark" />
      </div>
      <AttendanceChart data={chartData}/>
    </div>
  );
};

export default AttendanceChartContainer;
