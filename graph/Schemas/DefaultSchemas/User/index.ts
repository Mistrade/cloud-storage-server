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
import {
  Arg, Args,
  buildSchema,
  Field,
  FieldResolver,
  ID, MiddlewareFn, Mutation,
  ObjectType,
  Query,
  Resolver, ResolverInterface, Root, UseMiddleware
} from 'type-graphql'
import { User, UserModel } from '../../../../models/User'
import { setCookie } from '../../../../tools/tokenActions'
import { UpdateDevice, UpdateDeviceRequestModel } from '../../../../models/UpdateDeviceRequest'

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
      async resolve( parent: { device: any }, args: any ) {
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


@ObjectType( 'GraphUser' )
export class GraphUser {
  constructor( props: any ) {
  }

  @Field( () => ID, { nullable: true } ) readonly _id: string | null = null
  @Field( () => String, { nullable: true } ) name: string | null = null
  @Field( () => String, { nullable: true } ) surname: string | null = null
  @Field( () => String, { nullable: true } ) email: string | null = null
  @Field( () => GraphLastLogin, { nullable: true } ) lastLogin: typeof GraphLastLogin | null = null
  @Field( () => DeviceInfo, { nullable: true } ) device: DeviceInfo | null = null
  @Field( () => Number, { nullable: true } ) storageSpace: number | null = null
  @Field( () => Number, { nullable: true } ) usingSpace: number | null = null
  @Field( () => String, { nullable: true } ) avatar: string | null = null
  @Field( () => GraphError, { nullable: true } ) errors: GraphError | null = null
  @Field( () => [String], { nullable: true } ) files: Array<string> | null = null
  @Field( () => Number, { nullable: true } ) usingPercent: number | null = null
  // @Field( () => [AddDeviceRequest], { nullable: true } )
  // async addDeviceRequests( @Root( '_doc' ) root: GraphUser ): Promise<Array<UpdateDeviceRequestModel> | null> {
  //   const {_id} = root
  //   if(!_id) return null
  //
  //   const requests: Array<UpdateDeviceRequestModel> | null = await UpdateDevice.find({userId: _id})
  //
  //   if(!requests) return []
  //   else return requests
  // }
}

@Resolver( GraphUser )
export class GraphUserResolver {

  constructor( private props: GraphUser ) {
  }

  @Query( () => GraphUser )
  async getUserInfo( @Arg( 'id' ) id: string ): Promise<UserModel | null> {
    return User.findOne( { _id: id } )
  }

  @FieldResolver( () => DeviceInfo )
  async device( @Root( '_doc' ) user: GraphUser ) {
    return Device.findOne( { _id: user.device } )
  }

  @FieldResolver( () => Number, { nullable: true } )
  usingPercent( @Root( '_doc' ) user: GraphUser ) {
    const { usingSpace, storageSpace } = user
    return usingSpace && storageSpace ? ( usingSpace / storageSpace ) * 100 : null
  }

}

@ObjectType( 'DeviceInfo' )
class DeviceInfo {
  @Field( () => ID ) id: string = ''
  @Field( () => [DeviceItem!]! ) deviceInfo: DeviceModel['deviceInfo'] = []
  @Field( () => [IpItem!]! ) ipAddressList: DeviceModel['ipAddressList'] = []
  // @Field( () => [AddDeviceRequest], { nullable: true } ) requests: Array<UpdateDeviceRequestModel> | null = []
}

@ObjectType( 'AddDeviceRequest' )
class AddDeviceRequest {
  @Field( () => ID, { nullable: true } ) id: string | null = null
  @Field( () => String ) userId: string = ''
  @Field( () => Number ) die: number = 0
}

@Resolver( of => DeviceInfo )
export class DeviceInfoResolver {
  @FieldResolver( () => AddDeviceRequest )
  async requests( @Root( '_doc' ) root: AddDeviceRequest ): Promise<Array<UpdateDeviceRequestModel> | null> {
    console.log(root)
    console.log('root at requests')
    return []
  }

  // deviceInfo: DeviceModel["deviceInfo"]
  // id: string
  // ipAddressList: DeviceModel["ipAddressList"]
}


@ObjectType( 'IpItem' )
class IpItem {
  @Field( () => String ) ip: string = ''
}

@ObjectType( 'DeviceItem' )
class DeviceItem {
  @Field() userAgent: string = ''
  @Field( () => BrowserInfo, { nullable: true } ) browser: any = null
  @Field( () => EngineInfo, { nullable: true } ) engine: any = null
  @Field( () => OSInfo, { nullable: true } ) os: any = null
  @Field( () => DeviceTypeInfo, { nullable: true } ) device: any = null
  @Field( () => CPUInfo, { nullable: true } ) cpu: any = null
}

@ObjectType( 'Browser' )
class BrowserInfo {
  @Field( () => String, { nullable: true } ) name: string | null = null
  @Field( () => String, { nullable: true } ) version: string | null = null
  @Field( () => String, { nullable: true } ) major: string | null = null
}

@ObjectType( 'Engine' )
class EngineInfo {
  @Field( () => String, { nullable: true } ) name: string | null = null
  @Field( () => String, { nullable: true } ) version: string | null = null
}

@ObjectType( 'OS' )
class OSInfo {
  @Field( () => String, { nullable: true } ) name: string | null = null
  @Field( () => String, { nullable: true } ) version: string | null = null
}

@ObjectType( 'DeviceType' )
class DeviceTypeInfo {
  @Field( () => String, { nullable: true } ) type: string | null = null
}

@ObjectType( 'CPU' )
class CPUInfo {
  @Field( () => String, { nullable: true } ) architecture: string | null = null
}

@ObjectType( 'GraphError' )
class GraphError {
  @Field( () => String, { nullable: true } ) message: string | null = null
  @Field( () => String, { nullable: true } ) type?: string | null = null
  @Field( () => ID, { nullable: true } ) userId?: string | null = null
}

@ObjectType()
class GraphLastLogin {
  @Field()
  pattern: string = ''

  @Field()
  date: string = ''

  @Field( { nullable: false } )
  timestamp: number = 0
}

@ObjectType( 'Authorization' )
class Authorization extends GraphUser {

}

const AuthMiddleware: MiddlewareFn<any> = async ( {
                                                    root,
                                                    args,
                                                    context,
                                                    info
                                                  }, next ): Promise<any> => {
  const result: { errors: GraphError } | UserModel | null = await next()

  if( result && 'id' in result ) {
    const { res } = context
    setCookie( res, result )
  }

  return result
}

@Resolver( Authorization )
export class AuthorizationResolver {
  @Mutation( () => GraphUser )
  @UseMiddleware( AuthMiddleware )
  async loginUser( @Arg( 'email' ) email: string, @Arg( 'password' ) password: string ): Promise<{ errors: GraphError } | UserModel | null> {
    if( !email ) {
      return {
        errors: {
          message: 'Некорректное имя пользователя',
          type: 'Incorrect email'
        }
      }
    }

    const user: UserModel | null = await User.findOne( { email } )

    return user

  }
}


const LastLoginSchemas = new GraphQLObjectType( {
  name: 'lastLogin',
  fields: () => ( {
    timestamp: { type: GraphQLFloat },
    date: { type: GraphQLString },
    pattern: { type: GraphQLString }
  } )
} )