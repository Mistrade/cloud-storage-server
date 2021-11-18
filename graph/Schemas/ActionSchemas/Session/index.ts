import { GraphQLObjectType, GraphQLString } from 'graphql'

export const RegistrationSchemas = new GraphQLObjectType( {
  name: 'Registration',
  fields: () => ( {
    name: { type: GraphQLString },
    surname: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString }
  } )
} )

export const LoginSchemas = new GraphQLObjectType( {
  name: 'Login',
  fields: () => ( {
    email: { type: GraphQLString },
    password: { type: GraphQLString }
  } )
} )

export const CheckSessionSchemas = new GraphQLObjectType({
  name: "CheckSession",
  fields: () => ({
    type: {type: GraphQLString},
  })
})