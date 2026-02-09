import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  datasetStats,
  ageVsStage,
  medicationVsSeverity,
  bpScatterData,
  symptomPrevalence,
  genderPerStage,
} from "@/data/patientData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
  ScatterChart, Scatter,
} from "recharts";
import { Database, Users, Activity, Heart } from "lucide-react";

const STAGE_COLORS = ["#22c55e", "#f59e0b", "#f97316", "#ef4444"];
const GENDER_COLORS = ["#3b82f6", "#ec4899"];

const stageData = Object.entries(datasetStats.stageDistribution).map(([name, value]) => ({ name: name.replace("HYPERTENSION ", "").replace("HYPERTENSIVE ", ""), value }));
const genderData = Object.entries(datasetStats.genderDistribution).map(([name, value]) => ({ name, value }));

const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </CardContent>
  </Card>
);

const DataAnalysis = () => (
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 className="text-3xl font-bold text-medical-dark mb-2">Data Analysis Dashboard</h1>
    <p className="text-muted-foreground mb-6">
      Interactive visualizations from the patient dataset ({datasetStats.totalRecords} records)
    </p>

    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard icon={Database} label="Total Records" value={datasetStats.totalRecords} color="bg-medical" />
      <StatCard icon={Users} label="Male Patients" value={datasetStats.genderDistribution.Male} color="bg-blue-500" />
      <StatCard icon={Users} label="Female Patients" value={datasetStats.genderDistribution.Female} color="bg-pink-500" />
      <StatCard icon={Heart} label="Crisis Cases" value={datasetStats.stageDistribution["HYPERTENSIVE CRISIS"]} color="bg-red-500" />
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      {/* Gender Distribution */}
      <Card>
        <CardHeader><CardTitle className="text-base">Gender Distribution</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {genderData.map((_, i) => <Cell key={i} fill={GENDER_COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Hypertension Stages */}
      <Card>
        <CardHeader><CardTitle className="text-base">Hypertension Stages Distribution</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" name="Patients">
                {stageData.map((_, i) => <Cell key={i} fill={STAGE_COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Systolic vs Diastolic */}
      <Card>
        <CardHeader><CardTitle className="text-base">Systolic vs Diastolic Correlation</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="systolicVal" name="Systolic" tick={{ fontSize: 11 }} />
              <YAxis dataKey="diastolicVal" name="Diastolic" tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Legend />
              <Scatter name="Normal" data={bpScatterData.filter((d) => d.stage === "Normal")} fill="#22c55e" />
              <Scatter name="Stage-1" data={bpScatterData.filter((d) => d.stage === "Stage-1")} fill="#f59e0b" />
              <Scatter name="Stage-2" data={bpScatterData.filter((d) => d.stage === "Stage-2")} fill="#f97316" />
              <Scatter name="Crisis" data={bpScatterData.filter((d) => d.stage === "Crisis")} fill="#ef4444" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Medication vs Severity */}
      <Card>
        <CardHeader><CardTitle className="text-base">Medication vs Severity</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={medicationVsSeverity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="severity" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="On Medication" fill="#3b82f6" />
              <Bar dataKey="No Medication" fill="#94a3b8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Age Group vs Stages */}
      <Card>
        <CardHeader><CardTitle className="text-base">Age Group vs Hypertension Stages</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ageVsStage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Normal" fill="#22c55e" />
              <Bar dataKey="Stage-1" fill="#f59e0b" />
              <Bar dataKey="Stage-2" fill="#f97316" />
              <Bar dataKey="Crisis" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Symptom Prevalence */}
      <Card>
        <CardHeader><CardTitle className="text-base">Symptom & Risk Factor Prevalence</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={symptomPrevalence} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="symptom" type="category" tick={{ fontSize: 10 }} width={130} />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Bar dataKey="percentage" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  </main>
);

export default DataAnalysis;
