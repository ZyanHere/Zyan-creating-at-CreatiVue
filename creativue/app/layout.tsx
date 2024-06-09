import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import Room from "./Room";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "CreatiVue",
  description: "figma clone",
};

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "600", "700"],
});

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body className={`${workSans.className} bg-primary-grey-200`}>
      <Room>
        <TooltipProvider>{children}</TooltipProvider>
      </Room>
    </body>
  </html>
);

export default RootLayout;
