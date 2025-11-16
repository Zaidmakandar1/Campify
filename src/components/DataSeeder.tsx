import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { seedSampleData } from '@/lib/seedData';
import { Database, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function DataSeeder() {
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const result = await seedSampleData();
      if (result.success) {
        setSeeded(true);
        toast.success('Sample data seeded successfully!');
      } else {
        toast.error('Failed to seed data');
      }
    } catch (error) {
      console.error('Seeding error:', error);
      toast.error('Failed to seed data');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          <CardTitle>Sample Data</CardTitle>
        </div>
        <CardDescription>
          Populate the database with sample venues and feedback for testing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleSeedData} 
          disabled={seeding || seeded}
          className="w-full"
        >
          {seeding ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              Seeding...
            </>
          ) : seeded ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Data Seeded
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Seed Sample Data
            </>
          )}
        </Button>
        {seeded && (
          <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Sample data has been added to the database
          </p>
        )}
      </CardContent>
    </Card>
  );
}