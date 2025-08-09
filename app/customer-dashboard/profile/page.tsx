"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth";
import { updateMyProfile } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, MapPin } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setLocation(user.location || "");
      setDirty(false);
    }
  }, [user]);

  const onSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      setSaving(true);
      const res = await updateMyProfile({ firstName, lastName, email, location });
      if (res.success) {
        toast({ title: "Profile updated", description: "Your profile has been saved." });
        setDirty(false);
      } else {
        toast({ title: "Error", description: res.error || "Failed to update profile", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    if (!user) return;
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setEmail(user.email || "");
    setLocation(user.location || "");
    setDirty(false);
  };

  const initials = () => {
    if (user?.firstName || user?.lastName) {
      return `${(user.firstName || "").charAt(0)}${(user.lastName || "").charAt(0)}`.toUpperCase();
    }
    return (user?.email?.slice(0, 2) || "CU").toUpperCase();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Avatar className="h-14 w-14 bg-gray-200 text-gray-600 border border-gray-300">
            <AvatarImage src="/placeholder-user.jpg" />
            <AvatarFallback>{initials()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold truncate">{user?.firstName || user?.email}</h1>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" />{user?.email}</span>
              {user?.location && (
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{user.location}</span>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSave} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={(e) => { setFirstName(e.target.value); setDirty(true); }} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={(e) => { setLastName(e.target.value); setDirty(true); }} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setDirty(true); }} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={location} onChange={(e) => { setLocation(e.target.value); setDirty(true); }} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={saving || !dirty}>{saving ? "Saving..." : "Save Changes"}</Button>
                <Button type="button" variant="outline" onClick={onCancel} disabled={saving || !dirty}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


