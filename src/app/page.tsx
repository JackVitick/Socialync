import { AIOPostForm } from "@/components/AIOPostForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AIOPostPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-card/60 backdrop-blur-md border-[hsl(var(--border)/0.3)] shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Create New Post
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Upload your video, craft your message, and share it across your favorite platforms.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AIOPostForm />
        </CardContent>
      </Card>
    </div>
  );
}
