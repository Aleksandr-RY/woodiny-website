import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AdminLogin from "@/pages/admin-login";
import AdminLayout from "@/pages/admin-layout";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminInquiries from "@/pages/admin-inquiries";
import AdminProducts from "@/pages/admin-products";
import AdminPartners from "@/pages/admin-partners";
import AdminReviews from "@/pages/admin-reviews";
import AdminStaff from "@/pages/admin-staff";
import AdminNews from "@/pages/admin-news";
import AdminSettings from "@/pages/admin-settings";
import AdminSEO from "@/pages/admin-seo";
import AdminStats from "@/pages/admin-stats";
import AdminSiteEditor from "@/pages/admin-site-editor";

function AdminPage({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        <AdminPage><AdminDashboard /></AdminPage>
      </Route>
      <Route path="/admin/inquiries">
        <AdminPage><AdminInquiries /></AdminPage>
      </Route>
      <Route path="/admin/products">
        <AdminPage><AdminProducts /></AdminPage>
      </Route>
      <Route path="/admin/partners">
        <AdminPage><AdminPartners /></AdminPage>
      </Route>
      <Route path="/admin/reviews">
        <AdminPage><AdminReviews /></AdminPage>
      </Route>
      <Route path="/admin/staff">
        <AdminPage><AdminStaff /></AdminPage>
      </Route>
      <Route path="/admin/news">
        <AdminPage><AdminNews /></AdminPage>
      </Route>
      <Route path="/admin/settings">
        <AdminPage><AdminSettings /></AdminPage>
      </Route>
      <Route path="/admin/seo">
        <AdminPage><AdminSEO /></AdminPage>
      </Route>
      <Route path="/admin/stats">
        <AdminPage><AdminStats /></AdminPage>
      </Route>
      <Route path="/admin/editor">
        <AdminPage><AdminSiteEditor /></AdminPage>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
