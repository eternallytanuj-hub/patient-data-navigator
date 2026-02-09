import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Activity, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import ReactMarkdown from "react-markdown";

interface TrendData {
  readings: Array<{
    systolic: number;
    diastolic: number;
    stage: string;
    date: string;
  }>;
  latestSystolic: number;
  latestDiastolic: number;
  latestStage: string;
  readingCount: number;
  avgSystolic: number;
  avgDiastolic: number;
  systolicChange: number;
  diastolicChange: number;
}

interface AnalysisResult {
  analysis: string;
  trend: "improving" | "worsening" | "stable" | "neutral";
  trendData?: TrendData;
}

const ProgressTracker = () => {
  const { sessionId } = useSession();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalysis = async () => {
    if (!sessionId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-bp-trends", {
        body: { sessionId },
      });

      if (error) throw error;
      setAnalysisResult(data);
    } catch (error) {
      console.error("Failed to fetch analysis:", error);
      toast({
        title: "Error",
        description: "Failed to analyze BP trends",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchAnalysis();
    }
  }, [sessionId]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingDown className="h-5 w-5 text-green-500" />;
      case "worsening":
        return <TrendingUp className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-amber-500" />;
    }
  };

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case "improving":
        return <Badge className="bg-green-500">Improving ↓</Badge>;
      case "worsening":
        return <Badge className="bg-red-500">Needs Attention ↑</Badge>;
      case "stable":
        return <Badge className="bg-amber-500">Stable →</Badge>;
      default:
        return <Badge variant="outline">No Data</Badge>;
    }
  };

  const chartData = analysisResult?.trendData?.readings.map((r, i) => ({
    name: `#${i + 1}`,
    systolic: r.systolic,
    diastolic: r.diastolic,
    date: new Date(r.date).toLocaleDateString("en-IN", { 
      day: "numeric", 
      month: "short" 
    }),
  })) || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            BP Progress Tracker
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalysis}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && !analysisResult ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : analysisResult ? (
          <>
            {/* Trend Summary */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {getTrendIcon(analysisResult.trend)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Your Trend</span>
                  {getTrendBadge(analysisResult.trend)}
                </div>
                {analysisResult.trendData && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {analysisResult.trendData.readingCount} readings recorded
                  </p>
                )}
              </div>
            </div>

            {/* Chart */}
            {chartData.length > 1 && (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      domain={[60, 180]} 
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))" 
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="systolic"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--destructive))" }}
                      name="Systolic"
                    />
                    <Line
                      type="monotone"
                      dataKey="diastolic"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                      name="Diastolic"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* AI Analysis */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs font-medium text-primary mb-2">🤖 AI Analysis</p>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{analysisResult.analysis}</ReactMarkdown>
              </div>
            </div>

            {/* Stats */}
            {analysisResult.trendData && analysisResult.trendData.readingCount > 1 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Avg Systolic</p>
                  <p className="text-lg font-bold">{analysisResult.trendData.avgSystolic}</p>
                  <p className="text-xs text-muted-foreground">mmHg</p>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">Avg Diastolic</p>
                  <p className="text-lg font-bold">{analysisResult.trendData.avgDiastolic}</p>
                  <p className="text-xs text-muted-foreground">mmHg</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Complete assessments to track your BP progress</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;
