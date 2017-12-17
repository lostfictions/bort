import { Store } from 'redux'
import { BortStore } from '../store/store'

export interface HandlerArgs {
  message : string
  channel : string
  store : Store<BortStore>
  isDM : boolean
}
