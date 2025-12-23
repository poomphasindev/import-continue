import { Suspense, lazy } from "react"; // Import lazy and Suspense
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react"; // Icon for loading state

// Lazy load pages
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const LandownerDashboard = lazy(() => import("./pages/LandownerDashboard"));
const GardenerDashboard = lazy(() => import("./pages/GardenerDashboard"));
const SpaceForm = lazy(() => import("./pages/SpaceForm"));
const LandownerRequests = lazy(() => import("./pages/LandownerRequests"));
const SpaceDetail = lazy(() => import("./pages/SpaceDetail"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const QRCodePage = lazy(() => import("./pages/QRCodePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const Guide = lazy(() => import("./pages/Guide"));

const queryClient = new QueryClient();

// Loading Component
const PageLoader = () => (
  <div className="h-screen w-full flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-10 w-10 text-primary animate-spin" />
      <p className="text-sm text-slate-400 animate-pulse">กำลังโหลด...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          {/* Wrap Routes in Suspense with fallback */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route path="/guide" element={<Guide />} />
              
              {/* Landowner Routes */}
              <Route
                path="/dashboard/landowner"
                element={
                  <ProtectedRoute requiredRole="landowner">
                    <LandownerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/landowner/spaces/new"
                element={
                  <ProtectedRoute requiredRole="landowner">
                    <SpaceForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/landowner/spaces/:id/edit"
                element={
                  <ProtectedRoute requiredRole="landowner">
                    <SpaceForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/landowner/requests"
                element={
                  <ProtectedRoute requiredRole="landowner">
                    <LandownerRequests />
                  </ProtectedRoute>
                }
              />

              {/* Gardener Routes */}
              <Route
                path="/dashboard/gardener"
                element={
                  <ProtectedRoute requiredRole="gardener">
                    <GardenerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spaces/:id"
                element={
                  <ProtectedRoute requiredRole="gardener">
                    <SpaceDetail />
                  </ProtectedRoute>
                }
              />

              {/* Shared Routes */}
              <Route
                path="/requests/:id/chat"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requests/:id/qr"
                element={<QRCodePage />}
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;