import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to CardShop
        </h1>
        <p className="text-center text-lg mb-8">
          Your premier destination for trading cards
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg">Browse Products</Button>
          <Button size="lg" variant="outline">Learn More</Button>
        </div>
      </div>
    </main>
  )
}