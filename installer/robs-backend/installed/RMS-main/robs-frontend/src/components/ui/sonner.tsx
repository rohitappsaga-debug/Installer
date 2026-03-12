"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      duration={5000}
      icons={{
        success: <CheckCircle2 className="h-5 w-5" />,
        info: <Info className="h-5 w-5" />,
        warning: <AlertTriangle className="h-5 w-5" />,
        error: <XCircle className="h-5 w-5" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:px-6 group-[.toaster]:py-4 group-[.toaster]:backdrop-blur-md group-[.toaster]:border-l-4",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:!bg-green-50 dark:group-[.toaster]:!bg-green-950/20 group-[.toaster]:!border-l-green-600 group-[.toaster]:!text-green-800 dark:group-[.toaster]:!text-green-400 group-[.toaster]:!border-green-200 dark:group-[.toaster]:!border-green-800",
          error: "group-[.toaster]:!bg-red-50 dark:group-[.toaster]:!bg-red-950/20 group-[.toaster]:!border-l-red-600 group-[.toaster]:!text-red-800 dark:group-[.toaster]:!text-red-400 group-[.toaster]:!border-red-200 dark:group-[.toaster]:!border-red-800",
          info: "group-[.toaster]:!bg-blue-50 dark:group-[.toaster]:!bg-blue-950/20 group-[.toaster]:!border-l-blue-600 group-[.toaster]:!text-blue-800 dark:group-[.toaster]:!text-blue-400 group-[.toaster]:!border-blue-200 dark:group-[.toaster]:!border-blue-800",
          warning: "group-[.toaster]:!bg-amber-50 dark:group-[.toaster]:!bg-amber-950/20 group-[.toaster]:!border-l-amber-600 group-[.toaster]:!text-amber-800 dark:group-[.toaster]:!text-amber-400 group-[.toaster]:!border-amber-200 dark:group-[.toaster]:!border-amber-800",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
