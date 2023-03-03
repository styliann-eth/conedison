import { TransactionRequest, TransactionResponse } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { Deferrable } from '@ethersproject/properties'
import { JsonRpcProvider } from '@ethersproject/providers'

import { getWalletMeta } from './meta'

export * from './meta'
export * from './signing'

function isUniswapWallet(provider: JsonRpcProvider): boolean {
  return getWalletMeta(provider)?.name === 'Uniswap Wallet'
}

/**
 * Sends a transaction, optionally including a gas limit.
 *
 * The ethers sendTransaction implementation first checks the blockNumber, which causes a delay and may inhibit
 * deep-linking behavior on iOS. This wrapper works around that by optionally estimating gas (another source of delay),
 * and by sending the transaction as an unchecked transaction.
 * @see https://docs.walletconnect.com/2.0/swift/guides/mobile-linking#ios-app-link-constraints.
 */
export async function sendTransaction(
  provider: JsonRpcProvider,
  transaction: Deferrable<TransactionRequest>,
  gasMargin = 0,
  skipGasLimit = isUniswapWallet(provider)
): Promise<TransactionResponse> {
  let gasLimit: BigNumber | undefined
  if (!skipGasLimit) {
    gasLimit = await provider.estimateGas(transaction)
    if (gasMargin) {
      gasLimit = gasLimit.add(gasLimit.mul(Math.floor(gasMargin * 100)).div(100))
    }
  }

  const hash = await provider.getSigner().sendUncheckedTransaction({ ...transaction, gasLimit })
  return await provider.getTransaction(hash)
}
