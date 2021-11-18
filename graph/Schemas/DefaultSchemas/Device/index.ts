import { GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql'

export const DeviceInfoListSchemas = new GraphQLList( new GraphQLNonNull( new GraphQLObjectType( {
  name: 'Device',
  fields: () => ( {
    userAgent: { type: GraphQLString },
    browser: {
      type: new GraphQLNonNull( new GraphQLObjectType( {
        name: 'Browser',
        fields: () => ( {
          name: { type: GraphQLString },
          version: { type: GraphQLString },
          major: { type: GraphQLString }
        } )
      } ) )
    },
    engine: {
      type: new GraphQLNonNull( new GraphQLObjectType( {
        name: 'Engine',
        fields: () => ( {
          name: { type: GraphQLString },
          version: { type: GraphQLString }
        } )
      } ) )
    },
    os: {
      type: new GraphQLNonNull( new GraphQLObjectType( {
        name: 'OS',
        fields: () => ( {
          name: { type: GraphQLString },
          version: { type: GraphQLString }
        } )
      } ) )
    },
    device: {
      type: new GraphQLNonNull( new GraphQLObjectType( {
        name: 'DeviceType',
        fields: () => ( {
          type: { type: GraphQLString }
        } )
      } ) )
    },
    cpu: {
      type: new GraphQLNonNull( new GraphQLObjectType( {
        name: 'CPU',
        fields: () => ( {
          architecture: { type: GraphQLString }
        } )
      } ) )
    }
  } )
} ) ) )

export const IPInfoListSchemas = new GraphQLList( new GraphQLNonNull( new GraphQLObjectType( {
  name: 'IpItem',
  fields: () => ( {
    ip: { type: GraphQLString }
  } )
} ) ) )

export const DeviceInfoSchemas = new GraphQLObjectType( {
  name: 'DeviceInfo',
  fields: () => ( {
    id: { type: GraphQLString },
    deviceInfo: { type: DeviceInfoListSchemas },
    ipAddressList: { type: IPInfoListSchemas }
  } )
} )