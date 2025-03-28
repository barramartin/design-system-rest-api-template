import { GetLocalVariablesResponse, LocalVariable } from '@figma/rest-api-spec'
import { rgbToHex } from './color.js'
import { Token, TokensFile } from './token_types.js'

function tokenTypeFromVariable(variable: LocalVariable) {
  switch (variable.resolvedType) {
    case 'BOOLEAN':
      return 'boolean'
    case 'COLOR':
      return 'color'
    case 'FLOAT':
      return 'number'
    case 'STRING':
      return 'string'
  }
}

function tokenValueFromVariable(
  variable: LocalVariable,
  modeId: string,
  localVariables: { [id: string]: LocalVariable },
) {
  const value = variable.valuesByMode[modeId]
  if (typeof value === 'object') {
    if ('type' in value && value.type === 'VARIABLE_ALIAS') {
      const aliasedVariable = localVariables[value.id]
      return `{${aliasedVariable.name.replace(/\//g, '.')}}`
    } else if ('r' in value) {
      return rgbToHex(value)
    }

    throw new Error(`Format of variable value is invalid: ${value}`)
  } else {
    return value
  }
}

export function tokenFilesFromLocalVariables(localVariablesResponse: GetLocalVariablesResponse) {
  const tokenFiles: { [fileName: string]: TokensFile } = {}
  const localVariableCollections = localVariablesResponse.meta.variableCollections
  const localVariables = localVariablesResponse.meta.variables

  // Rendezzük a változókat gyűjtemények szerint
  const variablesByCollection: { [collectionId: string]: LocalVariable[] } = {}
  
  Object.values(localVariables).forEach((variable) => {
    // Skip remote variables because we only want to generate tokens for local variables
    if (variable.remote) {
      return
    }
    
    const collectionId = variable.variableCollectionId
    if (!variablesByCollection[collectionId]) {
      variablesByCollection[collectionId] = []
    }
    variablesByCollection[collectionId].push(variable)
  })
  
  // Végigmegyünk a gyűjteményeken
  Object.entries(variablesByCollection).forEach(([collectionId, variables]) => {
    const collection = localVariableCollections[collectionId]
    const hasMultipleModes = collection.modes.length > 1
    
    // Végigmegyünk minden módon
    collection.modes.forEach((mode) => {
      const fileName = `${collection.name}.${mode.name}`

      if (!tokenFiles[fileName]) {
        tokenFiles[fileName] = {}
      }
      
      // Végigmegyünk a változókon
      variables.forEach((variable) => {
        let obj: any = tokenFiles[fileName]
        const groupNames = variable.name.split('/')
        
        // A hierarchia létrehozása (kivéve az utolsó elemet, ami a változó neve)
        for (let i = 0; i < groupNames.length - 1; i++) {
          const groupName = groupNames[i]
          obj[groupName] = obj[groupName] || {}
          obj = obj[groupName]
        }
        
        // Az utolsó elem a változó neve
        let variableName = groupNames[groupNames.length - 1]
        
        // Ha több mód van, adjuk hozzá a mód nevét a változó nevéhez
        if (hasMultipleModes) {
          variableName = `${variableName}-${mode.name.toLowerCase().replace(/\s+/g, '-')}`
        }
        
        const token: Token = {
          $type: tokenTypeFromVariable(variable),
          $value: tokenValueFromVariable(variable, mode.modeId, localVariables),
          $description: variable.description,
          $extensions: {
            'com.figma': {
              hiddenFromPublishing: variable.hiddenFromPublishing,
              scopes: variable.scopes,
              codeSyntax: variable.codeSyntax,
            },
          },
        }
        
        obj[variableName] = token
      })
    })
  })

  return tokenFiles
}
