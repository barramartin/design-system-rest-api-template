import 'dotenv/config'
import * as fs from 'fs'

import FigmaApi from './figma_api.js'

import { green } from './utils.js'
import { tokenFilesFromLocalVariables } from './token_export.js'

//TODO Replace it with the correct tokens
const personalAccessToken = '';
const fileKey = '';

async function main() {

  const api = new FigmaApi(personalAccessToken)
  const localVariables = await api.getLocalVariables(fileKey)

  const tokensFiles = tokenFilesFromLocalVariables(localVariables)

  let outputDir = 'tokens'
  const outputArgIdx = process.argv.indexOf('--output')
  if (outputArgIdx !== -1) {
    outputDir = process.argv[outputArgIdx + 1]
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }

  Object.entries(tokensFiles).forEach(([fileName, fileContent]) => {
    fs.writeFileSync(`${outputDir}/${fileName}`, JSON.stringify(fileContent, null, 2))
    console.log(`Wrote ${fileName}`)
  })

  console.log(green(`✅ Tokens files have been written to the ${outputDir} directory`))
}

main()
