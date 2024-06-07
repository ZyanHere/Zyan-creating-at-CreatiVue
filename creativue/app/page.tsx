"use client"

import Live from "@/components/Live";
import Navbar from "@/components/Navbar";

export default function Page() {
  return (
      <main className="h-screen overflow-hidden">
        <Navbar/>
        <section>
          <Live/>
        </section>
      </main>
  );
}