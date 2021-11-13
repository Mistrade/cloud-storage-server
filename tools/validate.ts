interface ValidateToolsModel {
  checkPassword: (password: string) => ValidationResult,
  isLength: (str: string, min: number, max: number, pattern?: '>' | '>=') => boolean,
}

interface ValidationResult {
  status: boolean,
  message: string
}

export const validateRegularExpression = {
  cyrillicSymbols(){
    return new RegExp(/^[А-Яа-яЁё]+$/gi)
  }
}



export const validateTools: ValidateToolsModel = {
  checkPassword(password){
    const checkLength = this.isLength(password, 8, 32, '>=')

    if(!checkLength){
      return { status: false, message: `Пароль должен быть длиннее 8 символов и короче 32 символов.` }
    }

    const checkCyrillic = validateRegularExpression.cyrillicSymbols().test(password)

    if(checkCyrillic){
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
  isLength(str, min, max, pattern = '>='){
    if(pattern === '>='){
      return str.length >= min && str.length <= max
    } else {
      return str.length > min && str.length < max
    }
  }
}