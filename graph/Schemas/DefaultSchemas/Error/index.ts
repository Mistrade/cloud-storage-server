import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql'

export const ErrorSchemas = new GraphQLObjectType( {
  name: 'UserErrors',
  fields: () => ( {
    message: { type: new GraphQLNonNull( GraphQLString ) },
    userId: { type: GraphQLString },
    type: { type: GraphQLString },
    date: { type: GraphQLString }
  } ),
} )