
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, Users, Building } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: Building,
      title: "Company Management",
      description: "Track visits between supplier and seller companies"
    },
    {
      icon: MapPin,
      title: "Selling Points",
      description: "Visit specific locations with proper business relationships"
    },
    {
      icon: Users,
      title: "Contact Tracking",
      description: "Record who you visited and which agent performed the visit"
    },
    {
      icon: Calendar,
      title: "Activity Logging",
      description: "Categorize visits by activity type and date"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Visit Nexus Tracker
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional visit tracking system for business relationships between suppliers and sellers
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Start Tracking Visits</CardTitle>
              <CardDescription>
                Record your business visits with our comprehensive tracking system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/visit-tracker">
                <Button size="lg" className="w-full">
                  <MapPin className="w-5 h-5 mr-2" />
                  Start Visit Tracker
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-16 text-center text-gray-600">
          <p className="max-w-3xl mx-auto">
            This system ensures proper business relationships are maintained by validating that suppliers can only visit 
            selling points where active business relationships exist, and tracks all visit activities with proper agent 
            and contact information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
