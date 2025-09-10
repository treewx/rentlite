import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    const tests = []
    
    // Test DNS resolution
    try {
      const { stdout, stderr } = await execAsync('nslookup api.akahu.nz', { timeout: 5000 })
      tests.push({
        test: 'nslookup_akahu',
        success: !stderr && stdout.includes('Address'),
        output: stdout,
        error: stderr
      })
    } catch (error: any) {
      tests.push({
        test: 'nslookup_akahu',
        success: false,
        error: error.message
      })
    }

    // Test ping to api.akahu.nz
    try {
      const { stdout, stderr } = await execAsync('ping -c 1 api.akahu.nz', { timeout: 5000 })
      tests.push({
        test: 'ping_akahu',
        success: !stderr && stdout.includes('1 packets transmitted'),
        output: stdout,
        error: stderr
      })
    } catch (error: any) {
      tests.push({
        test: 'ping_akahu',
        success: false,
        error: error.message
      })
    }

    // Test resolving with different DNS
    try {
      const { stdout } = await execAsync('nslookup api.akahu.nz 8.8.8.8', { timeout: 5000 })
      tests.push({
        test: 'google_dns_lookup',
        success: stdout.includes('Address'),
        output: stdout
      })
    } catch (error: any) {
      tests.push({
        test: 'google_dns_lookup',
        success: false,
        error: error.message
      })
    }

    // Environment info
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      railwayEnv: process.env.RAILWAY_ENVIRONMENT,
      railwayRegion: process.env.RAILWAY_REGION,
      railwayProjectId: process.env.RAILWAY_PROJECT_ID,
      railwayServiceId: process.env.RAILWAY_SERVICE_ID,
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    }

    return NextResponse.json({
      environment: envInfo,
      dns_tests: tests,
      summary: {
        total: tests.length,
        passed: tests.filter(t => t.success).length,
        failed: tests.filter(t => !t.success).length,
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}