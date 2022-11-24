/**
 * This is a simple template for bug reproductions. It contains three models `Person`, `Animal` and `Movie`.
 * They create a simple IMDB-style database.
 * your bug.
 *
 * install:
 *    npm install objection knex sqlite3 chai
 *
 * run:
 *    node main
 */

 let Model;

 try {
   Model = require('./').Model;
 } catch (err) {
   Model = require('objection').Model;
 }
 
 const Knex = require('knex');
 const chai = require('chai');

 let testResult1;
 let testResult2;
 let testResult3;
 
 async function main() {
   await createSchema();
 
   ///////////////////////////////////////////////////////////////
   // Your reproduction
   ///////////////////////////////////////////////////////////////
 
   [testResult1] = await Person.query().insertAndFetch({
     firstName: 'Jennifer',
     lastName: 'Lawrence',
     isWoman: true,
   });
   
   testResult2 = await Person.query()
   .findOne({ firstName: 'Jennifer' })
 
  //  chai.expect(testResult1).to.deep.equal(testResult2);
   chai.expect(testResult1).to.equal(testResult3);
   chai.expect(testResult1.foo).to.equal('bar');
   chai.expect(testResult1.isWoman).to.be.false;
  }
 
 ///////////////////////////////////////////////////////////////
 // Database
 ///////////////////////////////////////////////////////////////
 
 const knex = Knex({
   client: 'sqlite3',
   useNullAsDefault: true,
   debug: false,
   connection: {
     filename: ':memory:'
   }
 });
 
 Model.knex(knex);
 
 ///////////////////////////////////////////////////////////////
 // Models
 ///////////////////////////////////////////////////////////////
 
 class Person extends Model {
   static get tableName() {
     return 'Person';
   }

   static async afterInsert(args) {
    await super.afterInsert(args);
    testResult3 = args.result[0];
    console.log(args.result[0]);
    args.result[0].foo = 'bar';
    args.result[0].isWoman = false;
    return args.result;
  }
 
   static get jsonSchema() {
     return {
       type: 'object',
       required: ['firstName', 'lastName'],
 
       properties: {
         id: { type: 'integer' },
         parentId: { type: ['integer', 'null'] },
         firstName: { type: 'string', minLength: 1, maxLength: 255 },
         lastName: { type: 'string', minLength: 1, maxLength: 255 },
         age: { type: 'number' },
 
         address: {
           type: 'object',
           properties: {
             street: { type: 'string' },
             city: { type: 'string' },
             zipCode: { type: 'string' }
           }
         }
       }
     };
   }
 
   static get relationMappings() {
     return {
       pets: {
         relation: Model.HasManyRelation,
         modelClass: Animal,
         join: {
           from: 'Person.id',
           to: 'Animal.ownerId'
         }
       },
 
       movies: {
         relation: Model.ManyToManyRelation,
         modelClass: Movie,
         join: {
           from: 'Person.id',
           through: {
             from: 'Person_Movie.personId',
             to: 'Person_Movie.movieId'
           },
           to: 'Movie.id'
         }
       },
 
       children: {
         relation: Model.HasManyRelation,
         modelClass: Person,
         join: {
           from: 'Person.id',
           to: 'Person.parentId'
         }
       },
 
       parent: {
         relation: Model.BelongsToOneRelation,
         modelClass: Person,
         join: {
           from: 'Person.parentId',
           to: 'Person.id'
         }
       }
     };
   }
 }
 
 class Animal extends Model {
   static get tableName() {
     return 'Animal';
   }
 
   static get jsonSchema() {
     return {
       type: 'object',
       required: ['name'],
 
       properties: {
         id: { type: 'integer' },
         ownerId: { type: ['integer', 'null'] },
         name: { type: 'string', minLength: 1, maxLength: 255 },
         species: { type: 'string', minLength: 1, maxLength: 255 }
       }
     };
   }
 
   static get relationMappings() {
     return {
       owner: {
         relation: Model.BelongsToOneRelation,
         modelClass: Person,
         join: {
           from: 'Animal.ownerId',
           to: 'Person.id'
         }
       }
     };
   }
 }
 
 class Movie extends Model {
   static get tableName() {
     return 'Movie';
   }
 
   static get jsonSchema() {
     return {
       type: 'object',
       required: ['name'],
 
       properties: {
         id: { type: 'integer' },
         name: { type: 'string', minLength: 1, maxLength: 255 }
       }
     };
   }
 
   static get relationMappings() {
     return {
       actors: {
         relation: Model.ManyToManyRelation,
         modelClass: Person,
         join: {
           from: 'Movie.id',
           through: {
             from: 'Person_Movie.movieId',
             to: 'Person_Movie.personId'
           },
           to: 'Person.id'
         }
       }
     };
   }
 }
 
 ///////////////////////////////////////////////////////////////
 // Schema
 ///////////////////////////////////////////////////////////////
 
 async function createSchema() {
   await knex.schema
     .dropTableIfExists('Person_Movie')
     .dropTableIfExists('Animal')
     .dropTableIfExists('Movie')
     .dropTableIfExists('Person');
 
   await knex.schema
     .createTable('Person', table => {
       table.increments('id').primary();
       table
         .integer('parentId')
         .unsigned()
         .references('id')
         .inTable('Person');
       table.string('firstName');
       table.string('lastName');
       table.integer('age');
       table.json('address');
       table.boolean('isWoman');
     })
     .createTable('Movie', table => {
       table.increments('id').primary();
       table.string('name');
     })
     .createTable('Animal', table => {
       table.increments('id').primary();
       table
         .integer('ownerId')
         .unsigned()
         .references('id')
         .inTable('Person');
       table.string('name');
       table.string('species');
     })
     .createTable('Person_Movie', table => {
       table.increments('id').primary();
       table
         .integer('personId')
         .unsigned()
         .references('id')
         .inTable('Person')
         .onDelete('CASCADE');
       table
         .integer('movieId')
         .unsigned()
         .references('id')
         .inTable('Movie')
         .onDelete('CASCADE');
     });
 }
 
 main()
   .then(() => {
     console.log('success');
     return knex.destroy();
   })
   .catch(err => {
     console.error(err);
     return knex.destroy();
   });
 