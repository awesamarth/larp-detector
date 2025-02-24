require('dotenv').config()
const { Telegraf, Scenes, session } = require('telegraf')
const Database = require('better-sqlite3')
const cron = require('node-cron')
const { isAddress, createWalletClient, http, createPublicClient } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')
const { holesky } = require("viem/chains")


const CONTRACT_ADDRESS = "0x1Eef1882Cc704801D400e2CA3a1047e554f4272f"
const ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "allowance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientAllowance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "balance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "needed",
        "type": "uint256"
      }
    ],
    "name": "ERC20InsufficientBalance",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "approver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidApprover",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidReceiver",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "ERC20InvalidSpender",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "mint",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
const PRIVATE_KEY = process.env.PRIVATE_KEY
const devAccount = privateKeyToAccount(`0x` + PRIVATE_KEY)

const client = createWalletClient({
  devAccount,
  chain: holesky,
  transport: http()
})

const publicClient = createPublicClient({
  chain: holesky,
  transport: http()
})


async function mintTokens(address) {
  const { request } = await publicClient.simulateContract({
    account: devAccount,
    address: CONTRACT_ADDRESS,
    abi: ABI,
    functionName: 'mint',
    args: [address, 10]
  })

  console.log(request)
  const writeHua = await client.writeContract(request)

  console.log(writeHua)
}



// // Initialize bot
const bot = new Telegraf(process.env.BOT_TOKEN)

// Initialize database
const db = new Database('users.db')

// Create users table if it doesn't exist
db.exec(`
 CREATE TABLE IF NOT EXISTS users (
   telegram_id TEXT PRIMARY KEY,
   github_username TEXT NOT NULL,
   wallet_address TEXT NOT NULL,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 )
`)

// Create registration scene
const registrationScene = new Scenes.WizardScene(
  'registration',
  // Step 1: Ask for GitHub username
  (ctx) => {
    ctx.reply('Please enter your GitHub username (eg. awesamarth):')
    return ctx.wizard.next()
  },
  // Step 2: Save GitHub username and ask for wallet
  (ctx) => {
    ctx.wizard.state.github = ctx.message.text
    ctx.reply('Please enter your Ethereum wallet address:')
    return ctx.wizard.next()
  },
  // Step 3: Validate and save wallet address
// Step 3: Validate and save wallet address
async (ctx) => {
  const walletAddress = ctx.message.text
  if (!isAddress(walletAddress)) {
    ctx.reply('Invalid wallet address. Please /register again.')
    return ctx.scene.leave()
  }

  try {
    // First save the user to database
    const stmt = db.prepare('INSERT OR REPLACE INTO users (telegram_id, github_username, wallet_address) VALUES (?, ?, ?)')
    stmt.run(ctx.from.id, ctx.wizard.state.github, walletAddress)

    // Then fetch the user data from database to confirm
    const user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(ctx.from.id)

    // Send initial success message
    await ctx.reply(`Registration successful! We will monitor your GitHub activity. Add this custom token's contract address to your wallet: ${CONTRACT_ADDRESS}`)

    // Immediately check activity for new registrant
    const hasCommits = await checkGithubActivity(user.github_username)
    if (!hasCommits) {
      try {
        await mintTokens(user.wallet_address)
        await ctx.reply(`🚨🚨FRESH LARP DETECTED!!!!! 🚨🚨\n\nYou haven't committed any code in the past 24 hours so I airdropped 10 LARP tokens to your wallet: ${user.wallet_address} lmao bozo\n\nLOCK TF IN!!`)
      } catch (error) {
        console.error(`Initial mint failed for ${user.wallet_address}:`, error)
        await ctx.reply('⚠️ Failed to airdrop initial LARP tokens - check your wallet address!')
      }
    }
  } catch (error) {
    ctx.reply('Error during registration. Please try again.')
    console.error(error)
  }

  return ctx.scene.leave()
}
)

const stage = new Scenes.Stage([registrationScene])
bot.use(session())
bot.use(stage.middleware())

// Basic start command
bot.command('start', (ctx) => {
  ctx.reply('Welcome to LARP Detector! Use /register to set up your GitHub and wallet address.')
})

// Register command
bot.command('register', (ctx) => ctx.scene.enter('registration'))

// Launch bot
bot.launch()

async function checkGithubActivity(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}/events`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) {
      console.error(`Error checking GitHub for ${username}: ${response.status}`)
      return false
    }

    const events = await response.json()

    // Check for any PushEvents in the last day
    const now = new Date()
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000) // 24 hours
    // const fiveMinutesAgo = new Date(now - 5 * 60 * 1000)      // 5 minutes


    const recentPushEvents = events.filter(event => {
      return event.type === 'PushEvent' &&

        // new Date(event.created_at) > oneDayAgo
        new Date(event.created_at) > oneDayAgo

    })

    return recentPushEvents.length > 0
  } catch (error) {
    console.error(`Error checking GitHub activity for ${username}:`, error)
    return false
  }
}

// Add the cron job
cron.schedule('0 0 * * *', async () => {
  console.log('Checking GitHub activity...')
  const users = db.prepare('SELECT * FROM users').all()

  console.log(users)

  for (const user of users) {
    const hasCommits = await checkGithubActivity(user.github_username)
    console.log("has commits? ", hasCommits)
    if (!hasCommits) {
      console.log(`Minting 10 LARP to ${user.wallet_address}`)
      try {
        await mintTokens(user.wallet_address)
        // Send success notification to user
        await bot.telegram.sendMessage(
          user.telegram_id,
          `🚨🚨 LARP DETECTED!!!!! 🚨🚨\n\nYou didn't commit any code in the past 24 hours so I airdropped 10 LARP tokens to your wallet: ${user.wallet_address} lmao bozo\n\n
          LOCK TF IN!!`
        )
      } catch (error) {
        console.error(`Failed to mint for ${user.wallet_address}:`, error)
        // Optional: Send failure notification
        await bot.telegram.sendMessage(
          user.telegram_id,
          `⚠️ Failed to airdrop LARP tokens - please check your wallet address is valid!`
        )
      }
    }
  }
})



// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))