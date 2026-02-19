class Schemas{

    static match(schema, object){

        switch(schema){
            case 'proccess':
                return this.proccess(object);

            default:
                throw Error('undefined schema');

        }

    }

    static proccess(object){

        if(!object || typeof object !== 'object') return false;

        if(! (object?.file && object?.params))  return false;

        const {file: id, params: {splits}} = object;

        if(!( id && typeof id === 'string' && this.isValidUUID(id) )) return false;

        if(! (splits && Array.isArray(splits) && splits.every(num => Number.isInteger(num) && num > 0) )) return false;
        return true;
    }

    static isValidUUID(str) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            .test(str);
    }
}


module.exports = Schemas;