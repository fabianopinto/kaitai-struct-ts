/**
 * @fileoverview Abstract Syntax Tree nodes for expression language
 * @module expression/AST
 * @author Fabiano Pinto
 * @license MIT
 */

/**
 * Base interface for all AST nodes.
 */
export interface ASTNode {
  /** Node type discriminator */
  kind: string
}

/**
 * Literal value node (number, string, boolean).
 */
export interface LiteralNode extends ASTNode {
  kind: 'Literal'
  value: number | string | boolean
}

/**
 * Identifier node (variable reference).
 */
export interface IdentifierNode extends ASTNode {
  kind: 'Identifier'
  name: string
}

/**
 * Binary operation node (e.g., a + b).
 */
export interface BinaryOpNode extends ASTNode {
  kind: 'BinaryOp'
  operator: string
  left: ASTNode
  right: ASTNode
}

/**
 * Unary operation node (e.g., -a, not b).
 */
export interface UnaryOpNode extends ASTNode {
  kind: 'UnaryOp'
  operator: string
  operand: ASTNode
}

/**
 * Ternary conditional node (condition ? ifTrue : ifFalse).
 */
export interface TernaryNode extends ASTNode {
  kind: 'Ternary'
  condition: ASTNode
  ifTrue: ASTNode
  ifFalse: ASTNode
}

/**
 * Member access node (object.property).
 */
export interface MemberAccessNode extends ASTNode {
  kind: 'MemberAccess'
  object: ASTNode
  property: string
}

/**
 * Array/index access node (array[index]).
 */
export interface IndexAccessNode extends ASTNode {
  kind: 'IndexAccess'
  object: ASTNode
  index: ASTNode
}

/**
 * Method call node (object.method()).
 */
export interface MethodCallNode extends ASTNode {
  kind: 'MethodCall'
  object: ASTNode
  method: string
  args: ASTNode[]
}

/**
 * Enum access node (EnumName::value).
 */
export interface EnumAccessNode extends ASTNode {
  kind: 'EnumAccess'
  enumName: string
  value: string
}

/**
 * Type union for all AST nodes.
 */
export type Expression =
  | LiteralNode
  | IdentifierNode
  | BinaryOpNode
  | UnaryOpNode
  | TernaryNode
  | MemberAccessNode
  | IndexAccessNode
  | MethodCallNode
  | EnumAccessNode

/**
 * Create a literal node.
 */
export function createLiteral(value: number | string | boolean): LiteralNode {
  return { kind: 'Literal', value }
}

/**
 * Create an identifier node.
 */
export function createIdentifier(name: string): IdentifierNode {
  return { kind: 'Identifier', name }
}

/**
 * Create a binary operation node.
 */
export function createBinaryOp(
  operator: string,
  left: ASTNode,
  right: ASTNode
): BinaryOpNode {
  return { kind: 'BinaryOp', operator, left, right }
}

/**
 * Create a unary operation node.
 */
export function createUnaryOp(operator: string, operand: ASTNode): UnaryOpNode {
  return { kind: 'UnaryOp', operator, operand }
}

/**
 * Create a ternary conditional node.
 */
export function createTernary(
  condition: ASTNode,
  ifTrue: ASTNode,
  ifFalse: ASTNode
): TernaryNode {
  return { kind: 'Ternary', condition, ifTrue, ifFalse }
}

/**
 * Create a member access node.
 */
export function createMemberAccess(
  object: ASTNode,
  property: string
): MemberAccessNode {
  return { kind: 'MemberAccess', object, property }
}

/**
 * Create an index access node.
 */
export function createIndexAccess(
  object: ASTNode,
  index: ASTNode
): IndexAccessNode {
  return { kind: 'IndexAccess', object, index }
}

/**
 * Create a method call node.
 */
export function createMethodCall(
  object: ASTNode,
  method: string,
  args: ASTNode[]
): MethodCallNode {
  return { kind: 'MethodCall', object, method, args }
}

/**
 * Create an enum access node.
 */
export function createEnumAccess(
  enumName: string,
  value: string
): EnumAccessNode {
  return { kind: 'EnumAccess', enumName, value }
}
