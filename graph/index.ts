import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLSchema,
  GraphQLInt,
  GraphQLFloat,
  GraphQLID,
  GraphQLNonNull,
  GraphQLList
} from 'graphql'
import { User, UserModel } from '../models/User'
import { UserSchemas } from './Schemas/DefaultSchemas/User'
import {
  CheckSessionSchemas,
  LoginSchemas,
  RegistrationSchemas
} from './Schemas/ActionSchemas/Session'
import { loginResolver } from './Resolvers/SessionResolvers'


const Query = new GraphQLObjectType( {
  fields: {
    getUserInfo: {
      type: UserSchemas,
      args: { id: { type: GraphQLID } },
      async resolve( parent, args ) {
        const user: UserModel | null = await User.findOne( { _id: args.id } )
        return user
      }
    }
  },
  name: 'Query'
} )

const Mutation = new GraphQLObjectType( {
  name: 'Mutation',
  fields: {
    regNewUser: {
      type: RegistrationSchemas,
      args: {
        email: { type: new GraphQLNonNull( GraphQLString ) },
        name: { type: new GraphQLNonNull( GraphQLString ) },
        surname: { type: new GraphQLNonNull( GraphQLString ) },
        password: { type: new GraphQLNonNull( GraphQLString ) }
      },
      async resolve( parent, args ) {
        try {
          const { email, name, surname, password } = args
          const user = new User( { email, name, surname, password } )
          await user.save()

          return user
        } catch (e) {
          // console.log( e )
          return {
            message: 'При регистрации пользователя произошла ошибка',
            error: e
          }
        }
      }
    },
    loginUser: {
      type: UserSchemas,
      args: {
        email: { type: new GraphQLNonNull( GraphQLString ) },
        password: { type: new GraphQLNonNull( GraphQLString ) }
      },
      resolve: loginResolver
    },
    checkSession: {
      type: CheckSessionSchemas,
      args: {
        type: { type: new GraphQLNonNull( GraphQLString ) }
      },
      resolve( parent, args, context ) {
        const { req, res } = context
      }
    }
  }
} )

export default new GraphQLSchema( {
  query: Query,
  mutation: Mutation
} )