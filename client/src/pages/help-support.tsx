import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, HelpCircle, BookOpen, Video, MessageCircle, Mail, 
  Phone, FileText, ChevronDown, ChevronRight, ExternalLink,
  Users, Stethoscope, FlaskRound, Pill, Calendar, DollarSign,
  Settings, Shield, AlertCircle, CheckCircle, Download, User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  roles?: string[];
}

const faqs: FAQ[] = [
  {
    id: "1",
    question: "How do I register a new patient?",
    answer: "To register a new patient, navigate to the Patients page and click the 'Register Patient' button. Fill in the required information including name, date of birth, contact details, and medical history. Click 'Save' to complete the registration.",
    category: "patients",
    roles: ["admin", "doctor", "nurse", "receptionist"]
  },
  {
    id: "2",
    question: "How do I record patient vitals?",
    answer: "Go to the patient's profile, click on the 'Vitals' tab, then click 'Record Vitals'. Enter the vital signs including blood pressure, temperature, pulse, and weight. The system will automatically flag abnormal values.",
    category: "patients",
    roles: ["doctor", "nurse"]
  },
  {
    id: "3",
    question: "How do I order lab tests?",
    answer: "From the patient's profile, click 'Order Lab Tests' in the actions menu. Select the tests from the available panels or search for specific tests. Add any special instructions and submit the order. The laboratory will receive the request immediately.",
    category: "laboratory",
    roles: ["doctor", "nurse"]
  },
  {
    id: "4",
    question: "How do I enter lab results?",
    answer: "Navigate to the Laboratory page, find the pending lab order, click 'Enter Results', fill in the test values and any observations, then save. Results will be automatically available to the ordering physician and patient portal.",
    category: "laboratory",
    roles: ["lab_technician", "admin"]
  },
  {
    id: "5",
    question: "How do I prescribe medications?",
    answer: "From the patient's profile, select 'Prescribe Medication'. Search for the medication in the catalog or enter custom medication. Specify dosage, frequency, duration, and any special instructions. The prescription will be sent to the pharmacy.",
    category: "pharmacy",
    roles: ["doctor"]
  },
  {
    id: "6",
    question: "How do I dispense medications?",
    answer: "Go to the Pharmacy page, find the prescription in the queue, verify the patient and medication details, record the quantity dispensed, and mark as dispensed. The system will update inventory automatically.",
    category: "pharmacy",
    roles: ["pharmacist"]
  },
  {
    id: "7",
    question: "How do I schedule an appointment?",
    answer: "Navigate to the Appointments page, click 'New Appointment', select the patient, doctor, date, time, and appointment type. Add any notes and save. Both patient and doctor will receive notifications.",
    category: "appointments",
    roles: ["admin", "receptionist", "doctor"]
  },
  {
    id: "8",
    question: "How do I create a new user account?",
    answer: "Go to User Management (admin only), click 'Create User', enter the user's details including username, email, role, and assign to an organization. The system will generate a temporary password that can be changed on first login.",
    category: "admin",
    roles: ["super_admin", "admin"]
  },
  {
    id: "9",
    question: "How do I generate reports?",
    answer: "Navigate to the relevant section (Clinical Performance, Revenue Analytics, etc.), select your date range and filters, then click 'Generate Report' or 'Export Data'. Reports can be downloaded as PDF or Excel files.",
    category: "reporting",
    roles: ["admin", "super_admin", "doctor"]
  },
  {
    id: "10",
    question: "What should I do if I see an error message?",
    answer: "First, try refreshing the page. If the error persists, check your internet connection. Screenshot the error message and contact support via the contact form below with details about what you were doing when the error occurred.",
    category: "troubleshooting",
    roles: ["all"]
  },
  {
    id: "11",
    question: "How do I change my password?",
    answer: "Go to My Profile, click on 'Security Settings', then 'Change Password'. Enter your current password and your new password twice for confirmation. Use a strong password with at least 8 characters including uppercase, lowercase, numbers, and symbols.",
    category: "account",
    roles: ["all"]
  },
  {
    id: "12",
    question: "How do I access patient records?",
    answer: "Navigate to the Patients page, use the search bar to find the patient by name, ID, or phone number. Click on the patient card to view their complete record including visit history, medications, lab results, and documents.",
    category: "patients",
    roles: ["doctor", "nurse", "admin"]
  }
];

const quickGuides = [
  {
    title: "Getting Started Guide",
    description: "Learn the basics of using the Bluequee healthcare system",
    icon: BookOpen,
    link: "#getting-started",
    roles: ["all"]
  },
  {
    title: "Patient Management",
    description: "Complete guide to registering and managing patients",
    icon: Users,
    link: "#patient-management",
    roles: ["admin", "doctor", "nurse", "receptionist"]
  },
  {
    title: "Clinical Workflow",
    description: "Step-by-step guide for consultations and treatments",
    icon: Stethoscope,
    link: "#clinical-workflow",
    roles: ["doctor", "nurse"]
  },
  {
    title: "Laboratory Operations",
    description: "How to order tests and manage lab results",
    icon: FlaskRound,
    link: "#laboratory",
    roles: ["doctor", "nurse", "lab_technician"]
  },
  {
    title: "Pharmacy Management",
    description: "Prescribing and dispensing medications",
    icon: Pill,
    link: "#pharmacy",
    roles: ["doctor", "pharmacist"]
  },
  {
    title: "Appointment System",
    description: "Scheduling and managing appointments",
    icon: Calendar,
    link: "#appointments",
    roles: ["admin", "receptionist", "doctor"]
  },
  {
    title: "Billing & Revenue",
    description: "Managing payments and financial reports",
    icon: DollarSign,
    link: "#billing",
    roles: ["admin", "accountant"]
  },
  {
    title: "System Administration",
    description: "User management and system settings",
    icon: Settings,
    link: "#administration",
    roles: ["super_admin", "admin"]
  }
];

export default function HelpAndSupport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("faq");
  const [supportForm, setSupportForm] = useState({
    subject: "",
    category: "",
    description: "",
    priority: "medium"
  });
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  // Filter FAQs based on search and user role
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = !faq.roles || 
      faq.roles.includes("all") || 
      faq.roles.includes(user?.role || "");
    
    return matchesSearch && matchesRole;
  });

  // Filter guides based on user role
  const filteredGuides = quickGuides.filter(guide => {
    return guide.roles.includes("all") || guide.roles.includes(user?.role || "");
  });

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically send this to your backend
    console.log("Support request:", supportForm);
    
    toast({
      title: "Support Request Submitted",
      description: "We'll get back to you within 24 hours.",
    });
    
    // Reset form
    setSupportForm({
      subject: "",
      category: "",
      description: "",
      priority: "medium"
    });
  };

  const categoryIcons: Record<string, any> = {
    patients: Users,
    laboratory: FlaskRound,
    pharmacy: Pill,
    appointments: Calendar,
    admin: Shield,
    reporting: FileText,
    troubleshooting: AlertCircle,
    account: User
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-gray-600 mt-1">Find answers, guides, and get assistance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Download Manual
          </Button>
          <Button variant="outline" className="gap-2">
            <Video className="w-4 h-4" />
            Video Tutorials
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search for help articles, FAQs, or guides..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 h-12 text-lg"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq" data-testid="tab-faq">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="guides" data-testid="tab-guides">
            <BookOpen className="w-4 h-4 mr-2" />
            Guides
          </TabsTrigger>
          <TabsTrigger value="contact" data-testid="tab-contact">
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Support
          </TabsTrigger>
          <TabsTrigger value="resources" data-testid="tab-resources">
            <FileText className="w-4 h-4 mr-2" />
            Resources
          </TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredFaqs.length === 0 ? (
              <Card className="healthcare-card">
                <CardContent className="p-12 text-center">
                  <HelpCircle className="h-12 w-12 text-muted mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No FAQs found matching your search." : "No FAQs available."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredFaqs.map((faq) => {
                const CategoryIcon = categoryIcons[faq.category] || HelpCircle;
                return (
                  <Collapsible
                    key={faq.id}
                    open={openFaqId === faq.id}
                    onOpenChange={(open) => setOpenFaqId(open ? faq.id : null)}
                  >
                    <Card className="healthcare-card hover:shadow-md transition-shadow">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="p-2 bg-primary/10 rounded-lg mt-1">
                                <CategoryIcon className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-lg font-semibold text-left">
                                  {faq.question}
                                </CardTitle>
                                <Badge variant="outline" className="mt-2 capitalize">
                                  {faq.category}
                                </Badge>
                              </div>
                            </div>
                            {openFaqId === faq.id ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground mt-1" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent>
                          <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Guides Tab */}
        <TabsContent value="guides" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGuides.map((guide) => {
              const Icon = guide.icon;
              return (
                <Card key={guide.title} className="healthcare-card hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{guide.title}</CardTitle>
                        <CardDescription>{guide.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="w-full justify-between group-hover:bg-accent">
                      View Guide
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Contact Support Tab */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Form */}
            <Card className="healthcare-card lg:col-span-2">
              <CardHeader>
                <CardTitle>Submit Support Request</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitSupport} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input
                      placeholder="Brief description of your issue"
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={supportForm.category}
                        onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                        required
                      >
                        <option value="">Select category</option>
                        <option value="technical">Technical Issue</option>
                        <option value="account">Account & Access</option>
                        <option value="billing">Billing</option>
                        <option value="feature">Feature Request</option>
                        <option value="training">Training</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Priority</label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={supportForm.priority}
                        onChange={(e) => setSupportForm({ ...supportForm, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      placeholder="Provide detailed information about your issue or question..."
                      rows={6}
                      value={supportForm.description}
                      onChange={(e) => setSupportForm({ ...supportForm, description: e.target.value })}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Submit Request
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-4">
              <Card className="healthcare-card">
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-sm text-muted-foreground">support@bluequee.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Phone Support</p>
                      <p className="text-sm text-muted-foreground">+234 800 BLUEQUEE</p>
                      <p className="text-xs text-muted-foreground">Mon-Fri: 8AM - 6PM WAT</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Live Chat</p>
                      <p className="text-sm text-muted-foreground">Available 24/7</p>
                      <Button variant="link" className="p-0 h-auto text-primary">
                        Start Chat
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="healthcare-card bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-primary mb-1">Emergency Support</p>
                      <p className="text-muted-foreground">
                        For critical system issues, call our emergency hotline: <strong>+234 800 911 HELP</strong>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="healthcare-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Tutorials
                </CardTitle>
                <CardDescription>Step-by-step video guides for common tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="w-full p-3 rounded-md bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground">
                  <Video className="h-4 w-4" />
                  <span>Getting Started with Bluequee</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Coming Soon</Badge>
                </div>
                <div className="w-full p-3 rounded-md bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground">
                  <Video className="h-4 w-4" />
                  <span>Patient Registration Walkthrough</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Coming Soon</Badge>
                </div>
                <div className="w-full p-3 rounded-md bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground">
                  <Video className="h-4 w-4" />
                  <span>Managing Lab Orders</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="healthcare-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Downloadable Resources
                </CardTitle>
                <CardDescription>PDF guides and documentation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="w-full p-3 rounded-md bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground" data-testid="resource-user-manual">
                  <FileText className="h-4 w-4" />
                  <span>User Manual (PDF)</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Coming Soon</Badge>
                </div>
                <div className="w-full p-3 rounded-md bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground" data-testid="resource-quick-reference">
                  <FileText className="h-4 w-4" />
                  <span>Quick Reference Guide</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Coming Soon</Badge>
                </div>
                <div className="w-full p-3 rounded-md bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground" data-testid="resource-keyboard-shortcuts">
                  <FileText className="h-4 w-4" />
                  <span>Keyboard Shortcuts Cheat Sheet</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="healthcare-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Compliance
                </CardTitle>
                <CardDescription>Data protection and privacy information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="w-full p-3 rounded-md bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>HIPAA Compliance Guide</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Coming Soon</Badge>
                </div>
                <div className="w-full p-3 rounded-md bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Data Security Best Practices</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Coming Soon</Badge>
                </div>
                <div className="w-full p-3 rounded-md bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Privacy Policy</span>
                  <Badge variant="outline" className="ml-auto text-xs">View in Settings</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="healthcare-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Training Materials
                </CardTitle>
                <CardDescription>Educational content for staff training</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="w-full p-3 rounded-md bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Clinical Workflow Training</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Coming Soon</Badge>
                </div>
                <div className="w-full p-3 rounded-md bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Pharmacy Module Training</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Coming Soon</Badge>
                </div>
                <div className="w-full p-3 rounded-md bg-muted/50 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Admin Panel Training</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
