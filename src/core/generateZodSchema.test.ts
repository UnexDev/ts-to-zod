import { camel } from "case";
import ts from "typescript";
import { findNode } from "../utils/findNode";
import { generateZodSchemaVariableStatement } from "./generateZodSchema";

describe("generateZodSchema", () => {
  it("should generate a string schema", () => {
    const source = `export type MyHeroName = string;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const myHeroNameSchema = z.string();"`
    );
  });

  it("should generate a number schema", () => {
    const source = `export type MyHeroAge = number;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const myHeroAgeSchema = z.number();"`
    );
  });

  it("should generate an any schema", () => {
    const source = `export type MyHeroPower = any;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const myHeroPowerSchema = z.any();"`
    );
  });

  it("should generate a boolean schema", () => {
    const source = `export type HavePower = boolean;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const havePowerSchema = z.boolean();"`
    );
  });

  it("should generate an undefined schema", () => {
    const source = `export type Nothing = undefined;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const nothingSchema = z.undefined();"`
    );
  });

  it("should generate a null schema", () => {
    const source = `export type MyHeroWeakness = null;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const myHeroWeaknessSchema = z.null();"`
    );
  });

  it("should generate a void schema", () => {
    const source = `export type MyEnnemyChance = void;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const myEnnemyChanceSchema = z.void();"`
    );
  });

  it("should generate a bigint schema", () => {
    const source = `export type loisLaneCapturedCount = bigint;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const loisLaneCapturedCountSchema = z.bigint();"`
    );
  });

  it("should generate a literal schema (string)", () => {
    const source = `export type Kryptonite = "kryptonite";`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const kryptoniteSchema = z.literal(\\"kryptonite\\");"`
    );
  });

  it("should generate a literal schema (number)", () => {
    const source = `export type IdentiesCount = 2;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const identiesCountSchema = z.literal(2);"`
    );
  });

  it("should generate a literal schema (true)", () => {
    const source = `export type IsSuperman = true;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const isSupermanSchema = z.literal(true);"`
    );
  });

  it("should generate a literal schema (false)", () => {
    const source = `export type CanBeatZod = false;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const canBeatZodSchema = z.literal(false);"`
    );
  });

  it("should generate an array schema (T[] notation)", () => {
    const source = `export type Vilains = string[];`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const vilainsSchema = z.array(z.string());"`
    );
  });

  it("should generate an array schema (Array<T> notation)", () => {
    const source = `export type Vilains = Array<string>;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const vilainsSchema = z.array(z.string());"`
    );
  });

  it("should generate an object schema", () => {
    const source = `export type Superman = {
     name: "superman";
     weakness: Kryptonite;
     age: number;
     ennemies: Array<string>;
   };`;
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const supermanSchema = z.object({
          name: z.literal(\\"superman\\"),
          weakness: kryptoniteSchema,
          age: z.number(),
          ennemies: z.array(z.string())
      });"
    `);
  });

  it("should generate a referenced schema", () => {
    const source = `export type Vilain = BadGuy;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const vilainSchema = badGuySchema;"`
    );
  });

  it("should generate a union schema", () => {
    const source = `export type Identity = "superman" | "clark kent";`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const identitySchema = z.union([z.literal(\\"superman\\"), z.literal(\\"clark kent\\")]);"`
    );
  });

  it("should generate two joined schemas", () => {
    const source = `export type SupermanWithWeakness = Superman & { weakness: Kryptonite };`;
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const supermanWithWeaknessSchema = supermanSchema.and(z.object({
          weakness: kryptoniteSchema
      }));"
    `);
  });

  it("should generate a record schema", () => {
    const source = `export type EnnemiesPowers = Record<string, Power>;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const ennemiesPowersSchema = z.record(powerSchema);"`
    );
  });

  it("should throw on non string record", () => {
    const source = `export type UnsupportedType = Record<number, number>;`;
    expect(() => generate(source)).toThrowErrorMatchingInlineSnapshot(
      `"Record<number, …> are not supported (https://github.com/colinhacks/zod/tree/v3#records)"`
    );
  });

  it("should throw on not supported key in omit", () => {
    const source = `export type UnsupportedType = Omit<Superman, Krytonite>;`;
    expect(() => generate(source)).toThrowErrorMatchingInlineSnapshot(
      `"Omit<T, K> unknown syntax: (TypeReference as K not supported)"`
    );
  });

  it("should throw on not supported key in omit (union)", () => {
    const source = `export type UnsupportedType = Omit<Superman, Krytonite | LoisLane>;`;
    expect(() => generate(source)).toThrowErrorMatchingInlineSnapshot(
      `"Omit<T, K> unknown syntax: (TypeReference as K union part not supported)"`
    );
  });

  it("should throw on not supported key in pick", () => {
    const source = `export type UnsupportedType = Pick<Superman, Krytonite>;`;
    expect(() => generate(source)).toThrowErrorMatchingInlineSnapshot(
      `"Pick<T, K> unknown syntax: (TypeReference as K not supported)"`
    );
  });

  it("should throw on not supported key in pick (union)", () => {
    const source = `export type UnsupportedType = Pick<Superman, Krytonite | LoisLane>;`;
    expect(() => generate(source)).toThrowErrorMatchingInlineSnapshot(
      `"Pick<T, K> unknown syntax: (TypeReference as K union part not supported)"`
    );
  });

  it("should fallback on the original type for Readonly<T>", () => {
    const source = `export type ReadonlySuperman = Readonly<Superman>;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const readonlySupermanSchema = supermanSchema;"`
    );
  });

  it("should generate a partial schema", () => {
    const source = `export type SupermanUnderKryptonite = Partial<Hero>;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const supermanUnderKryptoniteSchema = heroSchema.partial();"`
    );
  });

  it("should generate a required schema", () => {
    const source = `export type IDidFindYou = Required<VilainLocation>;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const iDidFindYouSchema = vilainLocationSchema.required();"`
    );
  });

  it("should generate a schema with omit", () => {
    const source = `export type InvincibleSuperman = Omit<Superman, "weakness">;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const invincibleSupermanSchema = supermanSchema.omit({ \\"weakness\\": true });"`
    );
  });

  it("should generate a schema with omit (multiple keys)", () => {
    const source = `export type VeryInvincibleSuperman = Omit<Superman, "weakness" | "wife">;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const veryInvincibleSupermanSchema = supermanSchema.omit({ \\"weakness\\": true, \\"wife\\": true });"`
    );
  });

  it("should generate a schema with pick", () => {
    const source = `export type YouJustKnowMyName = Pick<SecretIdentity, "name">;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const youJustKnowMyNameSchema = secretIdentitySchema.pick({ \\"name\\": true });"`
    );
  });

  it("should generate a schema with pick (multiple keys)", () => {
    const source = `export type YouKnowTooMuch = Pick<SecretIdentity, "name" | "location">;`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const youKnowTooMuchSchema = secretIdentitySchema.pick({ \\"name\\": true, \\"location\\": true });"`
    );
  });

  it("should generate a complex schema from an interface", () => {
    const source = `export interface Superman {
     name: "superman" | "clark kent" | "kal-l";
     ennemies: Record<string, Ennemy>;
     age: number;
     underKryptonite?: boolean;
     needGlasses: true | null;
   };`;
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const supermanSchema = z.object({
          name: z.union([z.literal(\\"superman\\"), z.literal(\\"clark kent\\"), z.literal(\\"kal-l\\")]),
          ennemies: z.record(ennemySchema),
          age: z.number(),
          underKryptonite: z.boolean().optional(),
          needGlasses: z.union([z.literal(true), z.null()])
      });"
    `);
  });

  it("should deal with literal keys", () => {
    const source = `export interface Vilain {
     "i.will.kill.everybody": true;
   };`;
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const vilainSchema = z.object({
          \\"i.will.kill.everybody\\": z.literal(true)
      });"
    `);
  });

  it("should deal with parenthesized type", () => {
    const source = `export type SecretVilain = (NormalGuy | Vilain);`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const secretVilainSchema = z.union([normalGuySchema, vilainSchema]);"`
    );
  });

  it("should deal with index signature", () => {
    const source = `export type Movies = {[title: string]: Movie};`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const moviesSchema = z.record(movieSchema);"`
    );
  });

  it("should deal with composed index signature", () => {
    const source = `export type Movies = {
      "Man of Steel": Movie & {title: "Man of Steel"};
      [title: string]: Movie
    };`;
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const moviesSchema = z.record(movieSchema).and(z.object({
          \\"Man of Steel\\": movieSchema.and(z.object({
              title: z.literal(\\"Man of Steel\\")
          }))
      }));"
    `);
  });

  it("should generate an empty object schema", () => {
    const source = `export type Empty = {};`;
    expect(generate(source)).toMatchInlineSnapshot(
      `"export const emptySchema = z.object({});"`
    );
  });

  it("should generate custom validators based on jsdoc tags", () => {
    const source = `export interface HeroContact {
      /**
       * The email of the hero.
       *
       * @format email
       */
      email: string;
    
      /**
       * The name of the hero.
       *
       * @minLenght 2
       * @maxLenght 50
       */
      name: string;
    
      /**
       * The phone number of the hero.
       *
       * @pattern ^([+]?d{1,2}[-s]?|)d{3}[-s]?d{3}[-s]?d{4}$
       */
      phoneNumber: string;
    
      /**
       * Does the hero has super power?
       *
       * @default true
       */
      hasSuperPower?: boolean;
      
      /**
       * The age of the hero
       * 
       * @minimum 0
       * @maximum 500
       */
      age: number;
    }`;
    expect(generate(source)).toMatchInlineSnapshot(`
      "export const heroContactSchema = z.object({
          /**
           * The email of the hero.
           *
           * @format email
           */
          email: z.string().email(),
          /**
           * The name of the hero.
           *
           * @minLenght 2
           * @maxLenght 50
           */
          name: z.string().min(2).max(50),
          /**
           * The phone number of the hero.
           *
           * @pattern ^([+]?d{1,2}[-s]?|)d{3}[-s]?d{3}[-s]?d{4}$
           */
          phoneNumber: z.string().regex(/^([+]?d{1,2}[-s]?|)d{3}[-s]?d{3}[-s]?d{4}$/),
          /**
           * Does the hero has super power?
           *
           * @default true
           */
          hasSuperPower: z.boolean().optional(),
          /**
           * The age of the hero
           *
           * @minimum 0
           * @maximum 500
           */
          age: z.number().min(0).max(500)
      });"
    `);
  });

  it("should ignore unknown/broken jsdoc format", () => {
    const source = `export interface Hero {
     /**
      * @secret
      * @format
      * @pattern
      */
     secretIdentity: string;
     /**
      * @maximum infinity
      */
     age: number;
     /**
      * My super power
      */
     power: Power;
   };`;

    expect(generate(source)).toMatchInlineSnapshot(`
      "export const heroSchema = z.object({
          /**
           * @secret
           * @format
           * @pattern
           */
          secretIdentity: z.string(),
          /**
           * @maximum infinity
           */
          age: z.number(),
          /**
           * My super power
           */
          power: powerSchema
      });"
    `);
  });

  it("should be able to override the zod import value", () => {
    const source = `export type TheLastTest = true`;

    expect(generate(source, "zod")).toMatchInlineSnapshot(
      `"export const theLastTestSchema = zod.literal(true);"`
    );
  });
});

/**
 * Wrapper to generate a zod schema from a string.
 *
 * @param sourceText Typescript interface or type
 * @returns Generated Zod schema
 */
function generate(sourceText: string, z?: string) {
  const sourceFile = ts.createSourceFile(
    "index.ts",
    sourceText,
    ts.ScriptTarget.Latest
  );
  const declaration = findNode(
    sourceFile,
    (node): node is ts.InterfaceDeclaration | ts.TypeAliasDeclaration =>
      ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)
  );
  if (!declaration) {
    throw new Error("No `type` or `interface` found!");
  }
  const interfaceName = declaration.name.text;
  const zodConstName = `${camel(interfaceName)}Schema`;

  const zodSchema = generateZodSchemaVariableStatement({
    zodImportValue: z,
    node: declaration,
    sourceFile,
    varName: zodConstName,
  });
  return ts
    .createPrinter({ newLine: ts.NewLineKind.LineFeed })
    .printNode(ts.EmitHint.Unspecified, zodSchema.statement, sourceFile);
}