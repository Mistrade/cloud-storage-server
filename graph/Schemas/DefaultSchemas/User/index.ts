import {
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import { Device, DeviceModel } from '../../../../models/Device'
import { DeviceInfoSchemas } from '../Device'
import { ErrorSchemas } from '../Error'
import { validateTools } from '../../../../tools/validate'

export const UserSchemas = new GraphQLObjectType( {
  name: 'User',
  fields: () => ( {
    id: { type: GraphQLID },
    name: { type: GraphQLString },
    surname: { type: GraphQLString },
    email: { type: GraphQLString },
    lastLogin: { type: LastLoginSchemas },
    device: {
      type: DeviceInfoSchemas,
      async resolve( parent, args ) {
        const device: DeviceModel | null = await Device.findOne( { _id: parent.device } )
        return device
      }
    },
    storageSpace: { type: GraphQLInt },
    usingSpace: { type: GraphQLInt },
    avatar: { type: GraphQLString },
    errors: { type: ErrorSchemas }
    // files: {type: GraphQLList},
  } )
} )

const LastLoginSchemas = new GraphQLObjectType( {
  name: 'lastLogin',
  fields: () => ( {
    timestamp: { type: GraphQLFloat },
    date: { type: GraphQLString },
    pattern: { type: GraphQLString }
  } )
} )