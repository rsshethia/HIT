import { useEffect, useRef, useState, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Pencil, Clock, X, Search, Building2, Cpu, Users, MapPinned } from "lucide-react";
import type { MapSystem, MapSystemHistory } from "@shared/schema";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

// Australian state bounding box
const AUSTRALIA_CENTER: [number, number] = [133.7751, -25.2744];
const AUSTRALIA_ZOOM = 3.8;

// Australian states for dropdown helper
const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

// Generate a simple math CAPTCHA
function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b, question: `${a} + ${b}` };
}

// Geocode a city + state using MapBox Geocoding API
async function geocodeCity(city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  const query = state ? `${city}, ${state}, Australia` : `${city}, Australia`;
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=AU&limit=1&access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.features?.length) return null;
  const [lng, lat] = data.features[0].center;
  return { lat, lng };
}

interface SystemFormData {
  systemName: string;
  vendor: string;
  department: string;
  organization: string;
  city: string;
  state: string;
  changeNote: string;
}

const emptyForm: SystemFormData = {
  systemName: "",
  vendor: "",
  department: "",
  organization: "",
  city: "",
  state: "",
  changeNote: "",
};

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<number, mapboxgl.Marker>>(new Map());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingSystem, setEditingSystem] = useState<MapSystem | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<MapSystem | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState<SystemFormData>(emptyForm);
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: systems = [] } = useQuery<MapSystem[]>({
    queryKey: ["/api/map/systems"],
  });

  const { data: history = [] } = useQuery<MapSystemHistory[]>({
    queryKey: ["/api/map/systems", selectedSystem?.id, "history"],
    enabled: !!selectedSystem && showHistory,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/map/systems", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/map/systems"] });
      toast({ title: "System added", description: "The healthcare system has been added to the map." });
      closeForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add system. Please try again.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PUT", `/api/map/systems/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/map/systems"] });
      queryClient.invalidateQueries({ queryKey: ["/api/map/systems", selectedSystem?.id, "history"] });
      toast({ title: "System updated", description: "The record has been updated and previous version saved to history." });
      closeForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update system. Please try again.", variant: "destructive" });
    },
  });

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: AUSTRALIA_CENTER,
      zoom: AUSTRALIA_ZOOM,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.ScaleControl(), "bottom-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Sync markers with systems data
  useEffect(() => {
    if (!map.current) return;

    const existingIds = new Set(markersRef.current.keys());
    const currentIds = new Set(systems.map(s => s.id));

    // Remove markers for deleted systems
    existingIds.forEach(id => {
      if (!currentIds.has(id)) {
        markersRef.current.get(id)?.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    systems.forEach(system => {
      if (markersRef.current.has(system.id)) {
        // Update position if needed
        const marker = markersRef.current.get(system.id)!;
        marker.setLngLat([system.longitude, system.latitude]);
        return;
      }

      // Create custom marker element
      const el = document.createElement("div");
      el.className = "map-marker";
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background: #2563eb;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s, background 0.2s;
      `;

      el.addEventListener("mouseenter", () => {
        el.style.background = "#1d4ed8";
        el.style.transform = "rotate(-45deg) scale(1.2)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.background = "#2563eb";
        el.style.transform = "rotate(-45deg) scale(1)";
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([system.longitude, system.latitude])
        .addTo(map.current!);

      el.addEventListener("click", () => {
        setSelectedSystem(system);
        setShowHistory(false);
        map.current?.flyTo({ center: [system.longitude, system.latitude], zoom: 9, duration: 800 });
      });

      markersRef.current.set(system.id, marker);
    });
  }, [systems]);

  // Update selected system when systems data refreshes
  useEffect(() => {
    if (selectedSystem) {
      const updated = systems.find(s => s.id === selectedSystem.id);
      if (updated) setSelectedSystem(updated);
    }
  }, [systems]);

  function openAddForm() {
    setEditingSystem(null);
    setFormData(emptyForm);
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
    setShowForm(true);
  }

  function openEditForm(system: MapSystem) {
    setEditingSystem(system);
    setFormData({
      systemName: system.systemName,
      vendor: system.vendor,
      department: system.department,
      organization: system.organization,
      city: system.city,
      state: system.state,
      changeNote: "",
    });
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingSystem(null);
    setFormData(emptyForm);
    setCaptchaInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate required fields
    const required = ["systemName", "vendor", "department", "organization", "city"] as const;
    for (const field of required) {
      if (!formData[field].trim()) {
        toast({ title: "Missing field", description: `Please fill in the ${field} field.`, variant: "destructive" });
        return;
      }
    }

    // Validate CAPTCHA
    if (parseInt(captchaInput) !== captcha.answer) {
      toast({ title: "Verification failed", description: "Please solve the math question correctly.", variant: "destructive" });
      setCaptcha(generateCaptcha());
      setCaptchaInput("");
      return;
    }

    // Geocode the city
    setGeocoding(true);
    const coords = await geocodeCity(formData.city, formData.state);
    setGeocoding(false);

    if (!coords) {
      toast({
        title: "Location not found",
        description: `Could not find "${formData.city}" in Australia. Please check the city name.`,
        variant: "destructive",
      });
      return;
    }

    const now = new Date().toISOString();
    const payload = {
      systemName: formData.systemName.trim(),
      vendor: formData.vendor.trim(),
      department: formData.department.trim(),
      organization: formData.organization.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      latitude: coords.lat,
      longitude: coords.lng,
      createdAt: editingSystem ? editingSystem.createdAt : now,
      updatedAt: now,
      changeNote: formData.changeNote.trim(),
    };

    if (editingSystem) {
      updateMutation.mutate({ id: editingSystem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const filteredSystems = useMemo(() => {
    if (!searchQuery.trim()) return systems;
    const q = searchQuery.toLowerCase();
    return systems.filter(s =>
      s.systemName.toLowerCase().includes(q) ||
      s.vendor.toLowerCase().includes(q) ||
      s.organization.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q)
    );
  }, [systems, searchQuery]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-AU", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-wrap z-10">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-bold text-gray-900">Healthcare Digital Systems Map</h1>
          <Badge variant="secondary" className="text-xs">{systems.length} {systems.length === 1 ? "system" : "systems"}</Badge>
        </div>
        <div className="flex-1 min-w-48">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search systems, vendors, orgs..."
              className="pl-8 h-9 text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={openAddForm} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add System
        </Button>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 bg-white border-r flex flex-col overflow-hidden shrink-0">
          <div className="px-3 py-2 border-b bg-gray-50">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {searchQuery ? `${filteredSystems.length} results` : "All Systems"}
            </p>
          </div>
          <ScrollArea className="flex-1">
            {filteredSystems.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">
                {searchQuery ? "No systems match your search." : "No systems yet. Click Add System to get started."}
              </div>
            ) : (
              <div className="divide-y">
                {filteredSystems.map(system => (
                  <button
                    key={system.id}
                    onClick={() => {
                      setSelectedSystem(system);
                      setShowHistory(false);
                      map.current?.flyTo({ center: [system.longitude, system.latitude], zoom: 9, duration: 800 });
                    }}
                    className={`w-full text-left px-3 py-3 hover:bg-blue-50 transition-colors ${selectedSystem?.id === system.id ? "bg-blue-50 border-l-2 border-blue-600" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{system.systemName}</p>
                        <p className="text-xs text-gray-500 truncate">{system.vendor}</p>
                        <p className="text-xs text-gray-400 truncate">{system.organization} · {system.city}{system.state ? `, ${system.state}` : ""}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapContainer} className="absolute inset-0" />

          {/* Detail panel */}
          {selectedSystem && (
            <div className="absolute top-3 right-3 w-80 bg-white rounded-xl shadow-xl border overflow-hidden z-10">
              <div className="bg-blue-600 px-4 py-3 flex items-start justify-between">
                <div className="min-w-0">
                  <h2 className="text-white font-bold text-base truncate">{selectedSystem.systemName}</h2>
                  <p className="text-blue-100 text-sm">{selectedSystem.vendor}</p>
                </div>
                <button
                  onClick={() => setSelectedSystem(null)}
                  className="text-blue-200 hover:text-white ml-2 mt-0.5 shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Users className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Department</p>
                      <p className="text-sm font-medium text-gray-800">{selectedSystem.department}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building2 className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide">Organisation</p>
                      <p className="text-sm font-medium text-gray-800">{selectedSystem.organization}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPinned className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Location</p>
                    <p className="text-sm font-medium text-gray-800">
                      {selectedSystem.city}{selectedSystem.state ? `, ${selectedSystem.state}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Cpu className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">System / Vendor</p>
                    <p className="text-sm font-medium text-gray-800">{selectedSystem.systemName} by {selectedSystem.vendor}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Added {formatDate(selectedSystem.createdAt)}</span>
                </div>
                {selectedSystem.updatedAt !== selectedSystem.createdAt && (
                  <div className="text-xs text-gray-400">
                    Updated {formatDate(selectedSystem.updatedAt)}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => {
                      setShowHistory(!showHistory);
                    }}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    History
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => openEditForm(selectedSystem)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Update
                  </Button>
                </div>

                {showHistory && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 border-b">
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Change History</p>
                    </div>
                    {history.length === 0 ? (
                      <p className="text-xs text-gray-400 p-3">No previous versions recorded.</p>
                    ) : (
                      <ScrollArea className="max-h-48">
                        <div className="divide-y">
                          {history.map((entry, idx) => (
                            <div key={entry.id} className="p-3 text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline" className="text-xs py-0">v{history.length - idx}</Badge>
                                <span className="text-gray-400">{formatDate(entry.changedAt)}</span>
                              </div>
                              <p className="text-gray-700 font-medium">{entry.systemName} · {entry.vendor}</p>
                              <p className="text-gray-500">{entry.department} · {entry.organization}</p>
                              <p className="text-gray-500">{entry.city}{entry.state ? `, ${entry.state}` : ""}</p>
                              {entry.changeNote && (
                                <p className="mt-1 text-gray-500 italic">"{entry.changeNote}"</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty state overlay */}
          {systems.length === 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border px-6 py-4 text-center max-w-xs z-10">
              <MapPin className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-800">No systems mapped yet</p>
              <p className="text-xs text-gray-500 mt-1">Click "Add System" to record a healthcare digital system and pin it to the map.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={open => { if (!open) closeForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSystem ? "Update System Record" : "Add Healthcare System"}</DialogTitle>
            <DialogDescription>
              {editingSystem
                ? "Update the details for this system. A copy of the current record will be saved to history."
                : "Record a digital system used by a healthcare organisation in Australia."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="systemName">System Name *</Label>
                <Input
                  id="systemName"
                  placeholder="e.g. iPharmacy"
                  value={formData.systemName}
                  onChange={e => setFormData(f => ({ ...f, systemName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor">Vendor / Company *</Label>
                <Input
                  id="vendor"
                  placeholder="e.g. Dedalus"
                  value={formData.vendor}
                  onChange={e => setFormData(f => ({ ...f, vendor: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  placeholder="e.g. Pharmacy"
                  value={formData.department}
                  onChange={e => setFormData(f => ({ ...f, department: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="organization">Organisation *</Label>
                <Input
                  id="organization"
                  placeholder="e.g. Bendigo Health"
                  value={formData.organization}
                  onChange={e => setFormData(f => ({ ...f, organization: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">City / Town *</Label>
                <Input
                  id="city"
                  placeholder="e.g. Bendigo"
                  value={formData.city}
                  onChange={e => setFormData(f => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <select
                  id="state"
                  value={formData.state}
                  onChange={e => setFormData(f => ({ ...f, state: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select state</option>
                  {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {editingSystem && (
              <div className="space-y-1.5">
                <Label htmlFor="changeNote">Reason for update (optional)</Label>
                <Input
                  id="changeNote"
                  placeholder="e.g. Vendor name corrected"
                  value={formData.changeNote}
                  onChange={e => setFormData(f => ({ ...f, changeNote: e.target.value }))}
                />
              </div>
            )}

            {/* Human verification */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Human Verification</p>
              <div className="flex items-center gap-3">
                <Label htmlFor="captcha" className="text-sm text-gray-700 whitespace-nowrap">
                  What is {captcha.question}?
                </Label>
                <Input
                  id="captcha"
                  type="number"
                  placeholder="Answer"
                  value={captchaInput}
                  onChange={e => setCaptchaInput(e.target.value)}
                  className="w-24"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
              <Button type="submit" disabled={isPending || geocoding}>
                {geocoding ? "Finding location..." : isPending ? "Saving..." : editingSystem ? "Update Record" : "Add to Map"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
