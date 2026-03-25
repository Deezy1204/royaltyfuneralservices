"use client";

import { Share2, Mail, MessageSquare, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface ShareDocumentButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
}

export function ShareDocumentButton({ title, text, url, className }: ShareDocumentButtonProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setShareUrl(url || window.location.href);
    if (typeof navigator !== "undefined" && 'share' in navigator) {
      setCanNativeShare(true);
    }
  }, [url]);

  const shareViaWhatsApp = () => {
    const message = `${text}\n\nLink: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${text}\n\nLink: ${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };
  
  const copyLink = async () => {
      try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied to clipboard");
      } catch (err) {
          toast.error("Failed to copy link");
      }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({
        title,
        text,
        url: shareUrl,
      });
      toast.success("Shared successfully");
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast.error("Error sharing document");
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          <Share2 className="mr-2 h-4 w-4" /> Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Share Document</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {canNativeShare && (
          <DropdownMenuItem onClick={nativeShare}>
            <Share2 className="mr-2 h-4 w-4" /> Native Share
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={shareViaWhatsApp}>
          <MessageSquare className="mr-2 h-4 w-4 text-green-600" /> WhatsApp
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={shareViaEmail}>
          <Mail className="mr-2 h-4 w-4 text-blue-600" /> Email
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={copyLink}>
          <LinkIcon className="mr-2 h-4 w-4 text-gray-600" /> Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
