import type { BscBridge } from '../../preload/index'
import type { BSC } from './sdk/BscSDK'

declare global {
  interface Window {
    bsc: BscBridge
    BSC: typeof BSC
  }
}

export {}
