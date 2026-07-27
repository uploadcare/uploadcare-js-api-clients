export {
  OPERATION_MODIFIERS,
  type DependencyKind,
  type OperationDependency,
  isOperationModifier,
  operationDependents,
  operationInputs
} from './dependencies'
export {
  CORE_OPERATIONS,
  type Diagnostic,
  type DiagnosticSeverity,
  INFO_OPERATIONS,
  MUST_BE_LAST_OPERATIONS,
  STACKABLE_OPERATIONS,
  type ValidationContext,
  isCoreOperation,
  isStackable,
  mustBeLast,
  validateOperations
} from './validate-operations'
