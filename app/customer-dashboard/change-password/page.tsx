"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { changeMyPassword } from "@/lib/api";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function ChangePasswordPage() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = () => {
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score; // 0 - 5
  };

  const onSave = async () => {
    if (!currentPassword || !newPassword) {
      toast({ title: "Missing fields", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Mismatch", description: "New password and confirmation do not match", variant: "destructive" });
      return;
    }
    try {
      setSaving(true);
      const res = await changeMyPassword({ currentPassword, newPassword });
      if (res.success) {
        toast({ title: "Password changed", description: "Your password has been updated." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({ title: "Error", description: res.error || "Failed to change password", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to change password", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <Card className="max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle>Change Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <div className="relative">
              <Input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurrent(v => !v)} aria-label="Toggle password visibility">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNew(v => !v)} aria-label="Toggle password visibility">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <div className="relative">
              <Input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirm(v => !v)} aria-label="Toggle password visibility">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="pt-2">
            <Button onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Update Password"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


