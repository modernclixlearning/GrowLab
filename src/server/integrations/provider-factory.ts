/**
 * GrowLab Sensor Provider Factory
 *
 * Returns the correct SensorProvider implementation for a given provider name.
 * F5 (Master Plan §5 F5).
 */

import type { SensorProvider } from './sensor-provider'
import { GoveeProvider } from './govee'
import { InkbirdProvider } from './inkbird'
import { SwitchBotProvider } from './switchbot'

export function getProvider(providerName: string): SensorProvider {
  switch (providerName) {
    case 'govee':
      return new GoveeProvider()
    case 'inkbird':
      return new InkbirdProvider()
    case 'switchbot':
      return new SwitchBotProvider()
    default:
      throw new Error(`Unknown sensor provider: ${providerName}`)
  }
}
