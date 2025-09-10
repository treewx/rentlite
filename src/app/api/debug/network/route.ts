import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
  try {
    const tests = []

    // Test 1: Basic DNS resolution
    try {
      const dnsTest = await fetch('https://api.akahu.nz', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      })
      tests.push({
        test: 'dns_resolution',
        success: true,
        status: dnsTest.status,
        message: 'Can reach api.akahu.nz'
      })
    } catch (error: any) {
      tests.push({
        test: 'dns_resolution',
        success: false,
        error: error.message,
        message: 'Cannot reach api.akahu.nz'
      })
    }

    // Test 2: Different external API
    try {
      const externalTest = await fetch('https://httpbin.org/get', {
        signal: AbortSignal.timeout(5000),
      })
      tests.push({
        test: 'external_api_test',
        success: externalTest.ok,
        status: externalTest.status,
        message: 'Can reach external APIs'
      })
    } catch (error: any) {
      tests.push({
        test: 'external_api_test',
        success: false,
        error: error.message,
        message: 'Cannot reach external APIs'
      })
    }

    // Test 3: Axios vs Fetch
    try {
      const axiosTest = await axios.get('https://httpbin.org/get', {
        timeout: 5000,
      })
      tests.push({
        test: 'axios_connectivity',
        success: true,
        status: axiosTest.status,
        message: 'Axios can make requests'
      })
    } catch (error: any) {
      tests.push({
        test: 'axios_connectivity',
        success: false,
        error: error.message,
        message: 'Axios cannot make requests'
      })
    }

    // Environment info
    const envInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      nodeEnv: process.env.NODE_ENV,
      hasAkahuTokens: !!(process.env.AKAHU_APP_TOKEN && process.env.AKAHU_USER_TOKEN),
    }

    return NextResponse.json({
      environment: envInfo,
      tests,
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