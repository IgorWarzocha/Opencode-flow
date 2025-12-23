import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Loader2 } from "lucide-react";

interface NewSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, baseBranch: string) => Promise<void>;
}

export function NewSessionDialog({ isOpen, onClose, onCreate }: NewSessionDialogProps) {
  const [title, setTitle] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [branches, setBranches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setBaseBranch("main");
      loadBranches();
    }
  }, [isOpen]);

  const loadBranches = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/git/branches");
      if (res.ok) {
        const data = await res.json();
        if (data.branches && Array.isArray(data.branches)) {
          // Fix: Extract 'name' property from branch objects if API returns { name, current }
          const branchNames = data.branches.map((b: unknown) =>
            typeof b === "string" ? b : (b as { name: string }).name,
          );
          setBranches(branchNames);

          if (branchNames.includes("main")) {
            setBaseBranch("main");
          } else if (branchNames.length > 0) {
            setBaseBranch(branchNames[0]);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load branches", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreate(title, baseBranch);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Name
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Feature name..."
              className="col-span-3"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="branch" className="text-right">
              Base Branch
            </Label>
            <div className="col-span-3">
              {isLoading ? (
                <div className="flex items-center text-xs text-muted-foreground h-10 px-3 border rounded-md">
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Loading branches...
                </div>
              ) : (
                <Select value={baseBranch} onValueChange={setBaseBranch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground pl-1">
            A new git worktree will be created from <strong>{baseBranch}</strong>.
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              "Create Session"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
