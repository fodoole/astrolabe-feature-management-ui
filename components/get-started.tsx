"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Code, Download, Globe, Zap, Shield, Database, ArrowRight, Copy, ExternalLink, Cpu, Network, Clock } from 'lucide-react'
import { useState } from "react"

export function GetStarted() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState("v1.0.5")

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const CodeBlock = ({ code, language, id }: { code: string; language: string; id: string }) => (
    <div className="relative">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        variant="outline"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? (
          <CheckCircle className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Get Started with Astrolabe</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Ship features faster and safer with our powerful feature flag system. 
          Control rollouts, run A/B tests, and manage feature lifecycles with confidence.
        </p>
      </div>

      {/* What is a Feature Flag System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            What is a Feature Flag System?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">
                A feature flag system allows teams to toggle features on/off without deploying code. 
                This enables safer deployments, A/B testing, gradual rollouts, and environment-specific behavior.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Deploy with Confidence</div>
                    <div className="text-sm text-muted-foreground">Release features behind flags and enable them when ready</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Target Specific Users</div>
                    <div className="text-sm text-muted-foreground">Show features to specific user segments or regions</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">A/B Test Everything</div>
                    <div className="text-sm text-muted-foreground">Run experiments with percentage-based traffic splits</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Kill Switch Ready</div>
                    <div className="text-sm text-muted-foreground">Instantly disable problematic features without deployment</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Flow Diagram */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h4 className="font-medium mb-4 text-center">How Flag Evaluation Works</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">User Attributes</div>
                    <div className="text-xs text-muted-foreground">country: "US", age: 25, premium: true</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-2" />
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Rule Evaluation</div>
                    <div className="text-xs text-muted-foreground">Check targeting rules & percentage splits</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-2" />
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">Flag Value</div>
                    <div className="text-xs text-muted-foreground">Return: true, "variant-a", or complex JSON</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Integration Options
          </CardTitle>
          <CardDescription>
            Choose your preferred integration method and get up and running in minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">SDK Version</label>
            <Select value={selectedVersion} onValueChange={setSelectedVersion}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v1.0.5">v1.0.5</SelectItem>
                <SelectItem value="v1.0.3">v1.0.3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Tabs defaultValue="python" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="python" className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                Python
              </TabsTrigger>
              <TabsTrigger value="nodejs" className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                Node.js
              </TabsTrigger>
            </TabsList>

            <TabsContent value="python" className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Installation</h4>
                <CodeBlock
                  code={`pip install git+https://github.com/fodoole/astrolabe-python-sdk.git@${selectedVersion}`}
                  language="bash"
                  id="python-install"
                />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Basic Usage</h4>
                <CodeBlock
                  code={`from astrolabe import AstrolabeClient

# Initialize the client
client = AstrolabeClient('development')

# Check if a feature is enabled (boolean flag)
if client.get_bool("new_checkout", False, {
    "user_id": "1234",
    "country": "US",
    "is_premium": True
}):
    render_new_checkout()
else:
    render_old_checkout()

# Get a feature value (for non-boolean flags)
payment_methods = client.get_json("payment_methods", 
    ["credit_card"],
    {"user_id": "1234"}
)

# Use the value
process_payment(payment_methods)`}
                  language="python"
                  id="python-usage"
                />
              </div>
            </TabsContent>

            <TabsContent value="nodejs" className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Installation</h4>
                <CodeBlock
                  code={`npm install git+https://github.com/fodoole/astrolabe-nodejs-sdk.git@${selectedVersion}`}
                  language="bash"
                  id="nodejs-install"
                />
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Basic Usage</h4>
                <CodeBlock
                  code={`const { AstrolabeClient } = require("astrolabe");

// Initialize the client
const client = new AstrolabeClient('development');

// Check if a feature is enabled (boolean flag)
const userAttributes = {
  user_id: "1234",
  country: "US",
  is_premium: true
};

if (client.get_bool("new_checkout", false, userAttributes)) {
  renderNewCheckout();
} else {
  renderOldCheckout();
}

// Get a feature value (for non-boolean flags)
const paymentMethods = client.get_json("payment_methods", 
  ["credit_card"], // default value
  userAttributes
);

// Use the value
processPayment(paymentMethods);`}
                  language="javascript"
                  id="nodejs-usage"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Performance and Reliability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            How It Works Under the Hood
          </CardTitle>
          <CardDescription>
            Built for performance, reliability, and scale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Thread-Safe SDKs</h4>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                All SDKs are designed to be thread-safe and can be used across concurrent 
                environments safely. No race conditions or shared state issues.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Memory Caching</h4>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Flags are not evaluated via API calls each time. The SDK downloads a logic 
                flow file once, caches it in memory, and uses it for local evaluation.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Network className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">No Excess Network Traffic</h4>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                No API hit per flag call. This minimizes latency and ensures system 
                resilience even when temporarily offline.
              </p>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-900 mb-2">Performance Guarantees</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span><strong>&lt;1ms</strong> evaluation time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span><strong>99.99%</strong> uptime SLA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-green-600" />
                    <span><strong>Zero</strong> API calls per evaluation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Quick Start Checklist
          </CardTitle>
          <CardDescription>
            Follow these steps to get up and running in under 5 minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">1</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Install SDK</span>
                  <Badge variant="outline" className="text-xs">Required</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Choose your language and install the Astrolabe SDK</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">2</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Get API Key</span>
                  <Badge variant="outline" className="text-xs">Required</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Generate an API key from your project settings</p>
                <Button variant="outline" size="sm" className="mt-2">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Generate API Key
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">3</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Initialize Client</span>
                  <Badge variant="outline" className="text-xs">Required</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Initialize the FeatureFlags client with your API key</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">4</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Use Flag Methods</span>
                  <Badge variant="secondary" className="text-xs">Easy</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Call <code className="bg-muted px-1 rounded text-xs">.is_enabled()</code> or <code className="bg-muted px-1 rounded text-xs">.get_value()</code> methods</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium mt-0.5">5</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">Enjoy Blazing-Fast Evaluation</span>
                  <Badge variant="secondary" className="text-xs">Automatic</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Experience sub-millisecond flag evaluation with local caching</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Ready to Ship!</span>
            </div>
            <p className="text-sm text-green-700">
              You're all set! Your feature flags will now evaluate locally with enterprise-grade performance and reliability.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>
            Dive deeper into advanced features and best practices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">📚 Documentation</div>
                <div className="text-sm text-muted-foreground">Complete API reference and guides</div>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto" />
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">🎯 Best Practices</div>
                <div className="text-sm text-muted-foreground">Learn from our feature flag experts</div>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto" />
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">🔧 Advanced Targeting</div>
                <div className="text-sm text-muted-foreground">Complex rules and percentage splits</div>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto" />
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">💬 Community Support</div>
                <div className="text-sm text-muted-foreground">Join our developer community</div>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
