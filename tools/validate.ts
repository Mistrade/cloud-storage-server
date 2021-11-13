import { LastLoginPatternType } from '../models/User'
import * as path from 'path'

interface ValidateToolsModel {
  checkPassword: ( password: string ) => ValidationResult,
  isLength: ( str: string, min: number, max: number, pattern?: '>' | '>=' ) => boolean,
  getLastLoginDate: (pattern: LastLoginPatternType) => {
    timestamp: number,
    date: string,
    pattern: LastLoginPatternType
  }
}

interface ValidationResult {
  status: boolean,
  message: string
}

export const validateRegularExpression = {
  cyrillicSymbols() {
    return new RegExp( /^[А-Яа-яЁё]+$/gi )
  },
  lastLoginPattern( pattern: LastLoginPatternType ) {
    switch (pattern) {
      default: {
        return {
          date: new RegExp( /^DD.MM.YYYY$/ ),
          time: new RegExp( /^HH:MM:SS$/ )
        }
      }
    }
  }
}


export const validateTools: ValidateToolsModel = {
  checkPassword( password ) {
    const checkLength = this.isLength( password, 8, 32, '>=' )

    if( !checkLength ) {
      return {
        status: false,
        message: `Пароль должен быть длиннее 8 символов и короче 32 символов.`
      }
    }

    const checkCyrillic = validateRegularExpression.cyrillicSymbols().test( password )

    if( checkCyrillic ) {
      return {
        status: false,
        message: 'В пароле запрещено использовать буквы русского алфавита.'
      }
    }

    return {
      status: true,
      message: ''
    }

  },
  isLength( str, min, max, pattern = '>=' ) {
    if( pattern === '>=' ) {
      return str.length >= min && str.length <= max
    } else {
      return str.length > min && str.length < max
    }
  },
  getLastLoginDate(pattern){
    const data = pattern.split(' ')
    const result = {
      date: '',
      time: '',
    }
    const testExpression = validateRegularExpression.lastLoginPattern(pattern)
    const date = new Date()

    data.forEach((item) => {
      if(testExpression.date.test(item)){
        const day = `${date.getDate() < 10 ? '0' + date.getDate() : date.getDate()}`
        const month = `${date.getMonth() + 1 < 10 ? '0' + date.getMonth() : date.getMonth()}`
        const year = `${date.getFullYear()}`

        item = item.replace('DD', day)
        item = item.replace('MM', month)
        item = item.replace('YYYY', year)

        result.date = item
      }

      if(testExpression.time.test(item)){
        const hours = `${date.getHours() < 10 ? '0' + date.getHours() : date.getHours()}`
        const minutes = `${date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()}`
        const seconds = `${date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()}`

        item = item.replace('HH', hours)
        item = item.replace('MM', minutes)
        item = item.replace('SS', seconds)

        result.time = item
      }
    })

    return {
      timestamp: date.getTime(),
      date: Object.values(result).join(' '),
      pattern
    }
  }
}