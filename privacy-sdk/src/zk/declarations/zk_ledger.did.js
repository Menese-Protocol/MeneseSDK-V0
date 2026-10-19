export const idlFactory = ({ IDL }) => {
  const GetBlocksResult = IDL.Rec();
  const Value = IDL.Rec();
  const AuditChunkResult = IDL.Record({
    'done' : IDL.Bool,
    'resume_cursor' : IDL.Nat,
  });
  const AtomicityPending = IDL.Record({
    'base_epoch' : IDL.Nat,
    'attempts' : IDL.Nat,
    'ledger_tip_before' : IDL.Nat,
    'verifier_outcome' : IDL.Text,
    'intent_id' : IDL.Vec(IDL.Nat8),
  });
  const Account = IDL.Record({
    'owner' : IDL.Principal,
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const AtomicityStatus = IDL.Record({
    'completed_unshield_intent_digest' : IDL.Vec(IDL.Nat8),
    'pending' : IDL.Opt(AtomicityPending),
    'test_fault_armed' : IDL.Bool,
    'token_configured' : IDL.Bool,
    'transparent_ledger_fee' : IDL.Nat,
    'completed_intent_digest' : IDL.Vec(IDL.Nat8),
    'transparent_ledger_decimals' : IDL.Nat8,
    'history_adapter' : IDL.Opt(IDL.Principal),
    'pool_account' : Account,
    'token_ledger' : IDL.Opt(IDL.Principal),
    'pending_unshield' : IDL.Opt(AtomicityPending),
    'completed_intents' : IDL.Nat,
    'completed_unshield_intents' : IDL.Nat,
  });
  const AuditState = IDL.Variant({
    'fail' : IDL.Record({ 'code' : IDL.Text, 'index' : IDL.Nat }),
    'pass' : IDL.Null,
    'running' : IDL.Null,
  });
  const AuditPhase = IDL.Variant({
    'set_roots' : IDL.Null,
    'log_index' : IDL.Null,
    'set_nullifiers' : IDL.Null,
    'tail' : IDL.Null,
    'set_shields' : IDL.Null,
    'notes' : IDL.Null,
    'set_unshields' : IDL.Null,
  });
  const AuditStatus = IDL.Record({
    'last_chunk_at' : IDL.Opt(IDL.Nat64),
    'total' : IDL.Nat,
    'cursor' : IDL.Nat,
    'state' : AuditState,
    'last_completed_at' : IDL.Opt(IDL.Nat64),
    'chunk_retries' : IDL.Nat,
    'guard' : IDL.Opt(IDL.Text),
    'phase' : AuditPhase,
    'guard_epoch' : IDL.Nat,
    'audit_epoch' : IDL.Nat,
  });
  const CompactTarget = IDL.Variant({
    'nullifiers' : IDL.Null,
    'roots' : IDL.Null,
    'unshields' : IDL.Null,
    'shields' : IDL.Null,
  });
  const Result_23 = IDL.Variant({
    'ok' : IDL.Record({
      'done' : IDL.Bool,
      'next' : IDL.Nat64,
      'scanned' : IDL.Nat,
      'offenders' : IDL.Nat,
    }),
    'err' : IDL.Text,
  });
  const CertifiedSnapshot = IDL.Record({
    'last_block_index' : IDL.Opt(IDL.Nat),
    'certificate' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'hash_tree' : IDL.Vec(IDL.Nat8),
    'note_root' : IDL.Vec(IDL.Nat8),
    'note_count' : IDL.Nat,
    'archive_manifest' : IDL.Vec(IDL.Nat8),
    'last_block_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'encoding_version' : IDL.Nat,
  });
  const ClaimRecord = IDL.Record({
    'envelope' : IDL.Vec(IDL.Nat8),
    'time' : IDL.Int,
    'index' : IDL.Nat,
    'note_position' : IDL.Nat,
  });
  const ClaimLogPage = IDL.Record({
    'total' : IDL.Nat,
    'records' : IDL.Vec(ClaimRecord),
  });
  const ClaimStatus = IDL.Record({
    'total' : IDL.Nat,
    'envelope_len' : IDL.Nat,
    'required' : IDL.Bool,
  });
  const Result_9 = IDL.Variant({ 'ok' : AuditStatus, 'err' : IDL.Text });
  const ForgedProofGuardConfig = IDL.Record({
    'threshold' : IDL.Nat,
    'cooldown_seconds' : IDL.Nat,
    'window_seconds' : IDL.Nat,
  });
  const ForgedProofGuardStatus = IDL.Record({
    'cooldown_until' : IDL.Int,
    'trips' : IDL.Nat,
    'cooling_down' : IDL.Bool,
    'window_started_at' : IDL.Int,
    'failures_total' : IDL.Nat,
    'failures_in_window' : IDL.Nat,
    'config' : ForgedProofGuardConfig,
  });
  const Result_6 = IDL.Variant({
    'ok' : ForgedProofGuardStatus,
    'err' : IDL.Text,
  });
  const Result_22 = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  const OutputRecord = IDL.Record({
    'ephemeral_key' : IDL.Vec(IDL.Nat8),
    'note_ciphertext' : IDL.Vec(IDL.Nat8),
    'commitment' : IDL.Vec(IDL.Nat8),
  });
  const TransferArgs = IDL.Record({
    'fee' : IDL.Nat64,
    'v_pub_out' : IDL.Nat64,
    'proof_hex' : IDL.Text,
    'recipient' : IDL.Opt(Account),
    'anchor' : IDL.Vec(IDL.Nat8),
    'claim_envelope' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'created_at_time' : IDL.Opt(IDL.Nat64),
    'nullifier_1' : IDL.Vec(IDL.Nat8),
    'nullifier_2' : IDL.Vec(IDL.Nat8),
    'output_1' : OutputRecord,
    'output_2' : OutputRecord,
  });
  const MutationResult = IDL.Record({
    'pool_value' : IDL.Nat,
    'instructions' : IDL.Nat64,
    'epoch' : IDL.Nat,
    'nullifier_count' : IDL.Nat,
    'note_root' : IDL.Vec(IDL.Nat8),
    'note_count' : IDL.Nat,
    'verifier_outcome' : IDL.Text,
    'outcome' : IDL.Text,
  });
  const TreeState = IDL.Record({
    'next_index' : IDL.Nat64,
    'root' : IDL.Text,
    'filled' : IDL.Vec(IDL.Text),
  });
  const LedgerStatus = IDL.Record({
    'pool_value' : IDL.Nat,
    'epoch' : IDL.Nat,
    'nullifier_count' : IDL.Nat,
    'tree_state' : IDL.Opt(TreeState),
    'configured' : IDL.Bool,
    'transfer_statement_version' : IDL.Nat,
    'historical_root_count' : IDL.Nat,
    'log_length' : IDL.Nat,
    'note_root' : IDL.Vec(IDL.Nat8),
    'note_count' : IDL.Nat,
    'administrator' : IDL.Opt(IDL.Principal),
  });
  const Result_2 = IDL.Variant({ 'ok' : LedgerStatus, 'err' : IDL.Text });
  const Result_21 = IDL.Variant({ 'ok' : AtomicityStatus, 'err' : IDL.Text });
  const Result_20 = IDL.Variant({
    'ok' : IDL.Record({
      'leaf' : IDL.Vec(IDL.Nat8),
      'path' : IDL.Vec(IDL.Tuple(IDL.Vec(IDL.Nat8), IDL.Bool)),
    }),
    'err' : IDL.Text,
  });
  const Result_19 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_18 = IDL.Variant({
    'ok' : IDL.Record({
      'c_tip' : IDL.Vec(IDL.Nat8),
      'root' : IDL.Vec(IDL.Nat8),
      'note_count' : IDL.Nat,
    }),
    'err' : IDL.Text,
  });
  const Result_12 = IDL.Variant({ 'ok' : IDL.Vec(IDL.Nat8), 'err' : IDL.Text });
  const NoteShape = IDL.Record({
    'note_ciphertext_len' : IDL.Nat,
    'ephemeral_key_len' : IDL.Nat,
  });
  const GetArchivesArgs = IDL.Record({ 'from' : IDL.Opt(IDL.Principal) });
  const ArchiveInfo = IDL.Record({
    'end' : IDL.Nat,
    'canister_id' : IDL.Principal,
    'start' : IDL.Nat,
  });
  const GetBlocksArgs = IDL.Record({ 'start' : IDL.Nat, 'length' : IDL.Nat });
  Value.fill(
    IDL.Variant({
      'Int' : IDL.Int,
      'Map' : IDL.Vec(IDL.Tuple(IDL.Text, Value)),
      'Nat' : IDL.Nat,
      'Blob' : IDL.Vec(IDL.Nat8),
      'Text' : IDL.Text,
      'Array' : IDL.Vec(Value),
    })
  );
  const Block = IDL.Record({ 'id' : IDL.Nat, 'block' : Value });
  const GetBlocksCallback = IDL.Func(
      [IDL.Vec(GetBlocksArgs)],
      [GetBlocksResult],
      ['query'],
    );
  const ArchivedBlocks = IDL.Record({
    'args' : IDL.Vec(GetBlocksArgs),
    'callback' : GetBlocksCallback,
  });
  GetBlocksResult.fill(
    IDL.Record({
      'log_length' : IDL.Nat,
      'blocks' : IDL.Vec(Block),
      'archived_blocks' : IDL.Vec(ArchivedBlocks),
    })
  );
  const DataCertificate = IDL.Record({
    'certificate' : IDL.Vec(IDL.Nat8),
    'hash_tree' : IDL.Vec(IDL.Nat8),
  });
  const TransferFromArgs = IDL.Record({
    'to' : Account,
    'fee' : IDL.Opt(IDL.Nat),
    'spender_subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'from' : Account,
    'memo' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'created_at_time' : IDL.Opt(IDL.Nat64),
    'amount' : IDL.Nat,
  });
  const PendingShield = IDL.Record({
    'output' : OutputRecord,
    'base_epoch' : IDL.Nat,
    'next_tree' : TreeState,
    'value' : IDL.Nat64,
    'attempts' : IDL.Nat,
    'anchor_before' : IDL.Vec(IDL.Nat8),
    'ledger_tip_before' : IDL.Nat,
    'caller' : IDL.Principal,
    'transfer_args' : TransferFromArgs,
    'verifier_outcome' : IDL.Text,
    'root_after' : IDL.Vec(IDL.Nat8),
    'intent_id' : IDL.Vec(IDL.Nat8),
  });
  const TransferArg = IDL.Record({
    'to' : Account,
    'fee' : IDL.Opt(IDL.Nat),
    'memo' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'from_subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'created_at_time' : IDL.Opt(IDL.Nat64),
    'amount' : IDL.Nat,
  });
  const PendingUnshield = IDL.Record({
    'base_epoch' : IDL.Nat,
    'next_tree' : TreeState,
    'attempts' : IDL.Nat,
    'anchor_before' : IDL.Vec(IDL.Nat8),
    'recipient_binding' : IDL.Vec(IDL.Nat8),
    'ledger_tip_before' : IDL.Nat,
    'caller' : IDL.Principal,
    'pool_debit' : IDL.Nat,
    'transfer_args' : TransferArg,
    'verifier_outcome' : IDL.Text,
    'root_after' : IDL.Vec(IDL.Nat8),
    'nullifier_1' : IDL.Vec(IDL.Nat8),
    'nullifier_2' : IDL.Vec(IDL.Nat8),
    'intent_id' : IDL.Vec(IDL.Nat8),
    'output_1' : OutputRecord,
    'output_2' : OutputRecord,
    'public_value' : IDL.Nat64,
  });
  const Result_17 = IDL.Variant({
    'ok' : IDL.Record({
      'shield' : IDL.Opt(PendingShield),
      'unshield' : IDL.Opt(PendingUnshield),
    }),
    'err' : IDL.Text,
  });
  const Pir2RepairStatus = IDL.Record({
    'from_shard' : IDL.Nat,
    'phase' : IDL.Text,
  });
  const Pir2IndexStatus = IDL.Variant({
    'ok' : IDL.Null,
    'repairing' : IDL.Null,
    'degraded' : IDL.Null,
    'catching_up' : IDL.Null,
  });
  const Pir2Status = IDL.Record({
    'lag' : IDL.Nat,
    'repair' : IDL.Opt(Pir2RepairStatus),
    'shard_size' : IDL.Nat,
    'backfill_cursor' : IDL.Nat,
    'last_fold_error' : IDL.Opt(IDL.Text),
    'enabled' : IDL.Bool,
    'last_chunk_instructions' : IDL.Nat64,
    'fold_inflight' : IDL.Bool,
    'note_count' : IDL.Nat,
    'backfilling' : IDL.Bool,
    'fold_trap_armed' : IDL.Nat,
    'fold_retries' : IDL.Nat,
    'indexed_upto' : IDL.Nat,
    'record_count' : IDL.Nat,
    'index_status' : Pir2IndexStatus,
  });
  const Result_14 = IDL.Variant({ 'ok' : Pir2Status, 'err' : IDL.Text });
  const Pir2Params = IDL.Record({
    'shard_size' : IDL.Nat,
    'a_domain' : IDL.Vec(IDL.Nat8),
    'record_bytes' : IDL.Nat,
    'hint_lwe_n' : IDL.Nat,
    'm_cols' : IDL.Nat,
    'm_rows' : IDL.Nat,
    'records_per_column' : IDL.Nat,
  });
  const Result_16 = IDL.Variant({ 'ok' : Pir2Params, 'err' : IDL.Text });
  const StripeTrace = IDL.Record({
    'columns_scanned' : IDL.Nat,
    'instructions' : IDL.Nat64,
    'target_index_parameters' : IDL.Nat,
    'selector_decryptions' : IDL.Nat,
    'cells_scanned' : IDL.Nat,
    'indexed_upto' : IDL.Nat,
    'target_dependent_branches' : IDL.Nat,
  });
  const Result_15 = IDL.Variant({
    'ok' : IDL.Tuple(IDL.Vec(IDL.Nat8), StripeTrace),
    'err' : IDL.Text,
  });
  const Result_13 = IDL.Variant({
    'ok' : IDL.Record({ 'covered' : IDL.Nat, 'digest' : IDL.Vec(IDL.Nat8) }),
    'err' : IDL.Text,
  });
  const LweCiphertext = IDL.Record({
    'a' : IDL.Vec(IDL.Nat64),
    'b' : IDL.Nat64,
  });
  const LwePirArgs = IDL.Record({ 'selectors' : IDL.Vec(LweCiphertext) });
  const LweQueryTrace = IDL.Record({
    'selectors_received' : IDL.Nat,
    'instructions' : IDL.Nat64,
    'target_index_parameters' : IDL.Nat,
    'records_scanned' : IDL.Nat,
    'selector_decryptions' : IDL.Nat,
    'output_bits' : IDL.Nat,
    'lwe_dimension' : IDL.Nat,
    'target_dependent_branches' : IDL.Nat,
  });
  const LwePirResponse = IDL.Record({
    'trace' : LweQueryTrace,
    'ciphertexts' : IDL.Vec(LweCiphertext),
    'snapshot_root' : IDL.Vec(IDL.Nat8),
  });
  const Result_8 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const PrepaidDepositArgs = IDL.Record({
    'value' : IDL.Nat64,
    'from_subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'created_at_time' : IDL.Nat64,
    'client_nonce' : IDL.Vec(IDL.Nat8),
  });
  const PendingPrepaid = IDL.Record({
    'op' : IDL.Variant({
      'withdraw' : IDL.Record({
        'source' : IDL.Variant({
          'revenue' : IDL.Null,
          'balance' : IDL.Null,
          'sweep' : IDL.Null,
          'treasury' : IDL.Null,
        }),
        'reserved' : IDL.Nat,
        'transfer_args' : TransferArg,
      }),
      'deposit' : IDL.Record({
        'value' : IDL.Nat64,
        'transfer_args' : TransferFromArgs,
      }),
    }),
    'attempts' : IDL.Nat,
    'ledger_tip_before' : IDL.Nat,
    'caller' : IDL.Principal,
    'intent_id' : IDL.Vec(IDL.Nat8),
  });
  const PrepaidFeeStatus = IDL.Record({
    'revenue' : IDL.Nat,
    'pending' : IDL.Opt(PendingPrepaid),
    'fee_account' : Account,
    'rate' : IDL.Nat,
    'enabled' : IDL.Bool,
    'holders' : IDL.Nat,
    'total_prepaid' : IDL.Nat,
    'completed_intents' : IDL.Nat,
  });
  const ProtocolFeeStatus = IDL.Record({
    'revenue' : IDL.Nat,
    'recipient' : IDL.Opt(Account),
    'unshield_bps' : IDL.Nat,
    'treasury_account' : Account,
    'transparent_ledger_fee' : IDL.Nat,
    'pool_custody_at_rest' : IDL.Nat,
    'send_fee' : IDL.Nat,
    'treasury' : IDL.Nat,
  });
  const Result_11 = IDL.Variant({
    'ok' : IDL.Record({
      'pool_debited' : IDL.Nat,
      'nullifiers_burned' : IDL.Nat,
      'change_notes_lost' : IDL.Nat,
      'payout_found' : IDL.Bool,
    }),
    'err' : IDL.Text,
  });
  const Result_10 = IDL.Variant({ 'ok' : TreeState, 'err' : IDL.Text });
  const RtsStatus = IDL.Record({
    'memory_size' : IDL.Nat,
    'max_live_size' : IDL.Nat,
    'heap_size' : IDL.Nat,
    'total_allocation' : IDL.Nat,
    'reclaimed' : IDL.Nat,
  });
  const Result_7 = IDL.Variant({ 'ok' : ClaimStatus, 'err' : IDL.Text });
  const Result_5 = IDL.Variant({ 'ok' : IDL.Opt(NoteShape), 'err' : IDL.Text });
  const Result_4 = IDL.Variant({ 'ok' : PrepaidFeeStatus, 'err' : IDL.Text });
  const ProtocolFeeConfig = IDL.Record({
    'recipient' : IDL.Opt(Account),
    'unshield_bps' : IDL.Nat,
    'send_fee' : IDL.Nat64,
  });
  const Result_3 = IDL.Variant({ 'ok' : ProtocolFeeStatus, 'err' : IDL.Text });
  const DepositArgs = IDL.Record({
    'proof_hex' : IDL.Text,
    'value' : IDL.Nat64,
    'from_subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'ephemeral_key' : IDL.Vec(IDL.Nat8),
    'created_at_time' : IDL.Nat64,
    'client_nonce' : IDL.Vec(IDL.Nat8),
    'note_ciphertext' : IDL.Vec(IDL.Nat8),
    'commitment' : IDL.Vec(IDL.Nat8),
  });
  const StorageStatus = IDL.Record({
    'note_digest' : IDL.Vec(IDL.Nat8),
    'completed_shield_entries' : IDL.Nat,
    'note_log_region_bytes' : IDL.Nat,
    'completed_shield_digest' : IDL.Vec(IDL.Nat8),
    'note_bytes' : IDL.Nat,
    'note_entries' : IDL.Nat,
    'completed_shield_region_bytes' : IDL.Nat,
    'nullifier_digest' : IDL.Vec(IDL.Nat8),
    'root_digest' : IDL.Vec(IDL.Nat8),
    'completed_unshield_region_bytes' : IDL.Nat,
    'completed_unshield_entries' : IDL.Nat,
    'nullifier_entries' : IDL.Nat,
    'nullifier_region_bytes' : IDL.Nat,
    'completed_unshield_digest' : IDL.Vec(IDL.Nat8),
    'root_capacity' : IDL.Nat,
    'layout_version' : IDL.Nat,
    'completed_shield_capacity' : IDL.Nat,
    'nullifier_capacity' : IDL.Nat,
    'root_region_bytes' : IDL.Nat,
    'completed_unshield_capacity' : IDL.Nat,
    'root_entries' : IDL.Nat,
  });
  const Result_1 = IDL.Variant({ 'ok' : StorageStatus, 'err' : IDL.Text });
  const Result = IDL.Variant({
    'ok' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'err' : IDL.Text,
  });
  return IDL.Service({
    '__audit_chunk' : IDL.Func([], [AuditChunkResult], []),
    '__detect_rebuild_chunk' : IDL.Func([], [IDL.Bool], []),
    '__pir2_fold_chunk' : IDL.Func([IDL.Bool], [IDL.Bool], []),
    'atomicity_status' : IDL.Func([], [AtomicityStatus], ['query']),
    'audit_status' : IDL.Func([], [AuditStatus], ['query']),
    'canonicality_scan' : IDL.Func(
        [CompactTarget, IDL.Nat64, IDL.Nat64],
        [Result_23],
        ['query'],
      ),
    'certified_snapshot' : IDL.Func([], [CertifiedSnapshot], ['query']),
    'claim_envelopes' : IDL.Func([IDL.Nat, IDL.Nat], [ClaimLogPage], ['query']),
    'claim_status' : IDL.Func([], [ClaimStatus], ['query']),
    'clear_audit_guard' : IDL.Func([], [Result_9], []),
    'clear_forged_proof_cooldown' : IDL.Func([], [Result_6], []),
    'compact_cost' : IDL.Func([], [IDL.Nat64], ['query']),
    'compact_nullifier_set' : IDL.Func([IDL.Nat64], [Result_22], []),
    'compact_set' : IDL.Func([CompactTarget, IDL.Nat64], [Result_22], []),
    'confidential_transfer' : IDL.Func([TransferArgs], [MutationResult], []),
    'configure' : IDL.Func(
        [IDL.Principal, IDL.Principal, IDL.Text, IDL.Text],
        [Result_2],
        [],
      ),
    'configure_cost' : IDL.Func([], [IDL.Nat64], ['query']),
    'configure_token_ledger' : IDL.Func(
        [IDL.Principal, IDL.Principal, IDL.Opt(IDL.Vec(IDL.Nat8))],
        [Result_21],
        [],
      ),
    'detect_boundary_proof' : IDL.Func([IDL.Nat], [Result_20], ['query']),
    'detect_chain_disable' : IDL.Func([], [Result_19], []),
    'detect_chain_enable' : IDL.Func([], [Result_19], []),
    'detect_chain_rebuild' : IDL.Func([], [Result_19], []),
    'detect_chain_rebuild_resume' : IDL.Func([], [Result_19], []),
    'detect_rebuild_status' : IDL.Func(
        [],
        [
          IDL.Record({
            'active' : IDL.Bool,
            'cursor' : IDL.Nat,
            'error' : IDL.Opt(IDL.Text),
          }),
        ],
        ['query'],
      ),
    'detect_stream_anchor' : IDL.Func([], [Result_18], ['query']),
    'detection_stream' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(IDL.Nat8)],
        ['query'],
      ),
    'finalize_divergence' : IDL.Func(
        [],
        [
          IDL.Record({
            'count' : IDL.Nat,
            'last_intent' : IDL.Opt(IDL.Vec(IDL.Nat8)),
          }),
        ],
        ['query'],
      ),
    'forged_proof_guard_status' : IDL.Func(
        [],
        [ForgedProofGuardStatus],
        ['query'],
      ),
    'freeze_verifying_keys' : IDL.Func([IDL.Vec(IDL.Nat8)], [Result_12], []),
    'get_note_shape' : IDL.Func([], [IDL.Opt(NoteShape)], ['query']),
    'icrc3_get_archives' : IDL.Func(
        [GetArchivesArgs],
        [IDL.Vec(ArchiveInfo)],
        ['query'],
      ),
    'icrc3_get_blocks' : IDL.Func(
        [IDL.Vec(GetBlocksArgs)],
        [GetBlocksResult],
        ['query'],
      ),
    'icrc3_get_tip_certificate' : IDL.Func(
        [],
        [IDL.Opt(DataCertificate)],
        ['query'],
      ),
    'icrc3_supported_block_types' : IDL.Func(
        [],
        [IDL.Vec(IDL.Record({ 'url' : IDL.Text, 'block_type' : IDL.Text }))],
        ['query'],
      ),
    'is_known_root' : IDL.Func([IDL.Vec(IDL.Nat8)], [IDL.Bool], ['query']),
    'is_nullifier_spent' : IDL.Func([IDL.Vec(IDL.Nat8)], [IDL.Bool], ['query']),
    'pending_intent_detail' : IDL.Func([], [Result_17], ['query']),
    'pir2_enable' : IDL.Func([IDL.Nat], [Result_14], []),
    'pir2_hint_chunk' : IDL.Func(
        [IDL.Nat, IDL.Nat, IDL.Nat],
        [Result_12],
        ['query'],
      ),
    'pir2_params' : IDL.Func([], [Result_16], ['query']),
    'pir2_query' : IDL.Func(
        [IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat, IDL.Vec(IDL.Nat8)],
        [Result_15],
        ['query'],
      ),
    'pir2_record_stream' : IDL.Func([IDL.Nat, IDL.Nat], [Result_12], ['query']),
    'pir2_reindex' : IDL.Func([IDL.Nat], [Result_14], []),
    'pir2_status' : IDL.Func([], [Pir2Status], ['query']),
    'pir2_stream_boundary' : IDL.Func([], [Result_13], ['query']),
    'pir_query_lwe' : IDL.Func([LwePirArgs], [LwePirResponse], ['query']),
    'postupgrade_stats' : IDL.Func(
        [],
        [
          IDL.Record({
            'heap_before' : IDL.Nat,
            'heap_after' : IDL.Nat,
            'instructions' : IDL.Nat64,
          }),
        ],
        ['query'],
      ),
    'prepaid_fee_balance' : IDL.Func([], [IDL.Nat], ['query']),
    'prepaid_fee_collect' : IDL.Func(
        [IDL.Nat64, Account, IDL.Nat64],
        [Result_8],
        [],
      ),
    'prepaid_fee_deposit' : IDL.Func([PrepaidDepositArgs], [Result_8], []),
    'prepaid_fee_status' : IDL.Func([], [PrepaidFeeStatus], ['query']),
    'prepaid_fee_withdraw' : IDL.Func([IDL.Nat64, IDL.Nat64], [Result_8], []),
    'protocol_fee_status' : IDL.Func([], [ProtocolFeeStatus], ['query']),
    'protocol_fee_sweep' : IDL.Func([IDL.Nat64, IDL.Nat64], [Result_8], []),
    'protocol_treasury_withdraw' : IDL.Func(
        [IDL.Nat64, IDL.Nat64],
        [Result_8],
        [],
      ),
    'quarantine_status' : IDL.Func(
        [],
        [IDL.Bool, IDL.Vec(IDL.Text)],
        ['query'],
      ),
    'recipient_binding' : IDL.Func([Account], [Result_12], ['query']),
    'release_unfinalizable_unshield' : IDL.Func([], [Result_11], []),
    'repair_tree_state' : IDL.Func(
        [IDL.Vec(IDL.Text), IDL.Nat64],
        [Result_10],
        [],
      ),
    'required_transfer_fee' : IDL.Func([IDL.Nat64], [IDL.Nat], ['query']),
    'restart_audit' : IDL.Func([], [Result_9], []),
    'resume_prepaid' : IDL.Func([], [Result_8], []),
    'resume_shield' : IDL.Func([], [MutationResult], []),
    'resume_unshield' : IDL.Func([], [MutationResult], []),
    'rotate_verifying_keys_v2' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        [Result_2],
        [],
      ),
    'rts_status' : IDL.Func([], [RtsStatus], ['query']),
    'set_claim_envelopes_required' : IDL.Func([IDL.Bool], [Result_7], []),
    'set_forged_proof_guard' : IDL.Func(
        [ForgedProofGuardConfig],
        [Result_6],
        [],
      ),
    'set_note_shape' : IDL.Func([IDL.Opt(NoteShape)], [Result_5], []),
    'set_prepaid_fee' : IDL.Func([IDL.Bool], [Result_4], []),
    'set_prepaid_fee_rate' : IDL.Func([IDL.Nat64], [Result_4], []),
    'set_protocol_fee' : IDL.Func([ProtocolFeeConfig], [Result_3], []),
    'set_tree_frontier' : IDL.Func([IDL.Bool], [Result_2], []),
    'set_tree_oracle' : IDL.Func([IDL.Opt(IDL.Principal)], [Result_2], []),
    'shield' : IDL.Func([DepositArgs], [MutationResult], []),
    'status' : IDL.Func([], [LedgerStatus], ['query']),
    'storage_status' : IDL.Func([], [StorageStatus], ['query']),
    'tree_frontier_status' : IDL.Func(
        [],
        [
          IDL.Record({
            'enabled' : IDL.Bool,
            'tree_oracle' : IDL.Opt(IDL.Principal),
          }),
        ],
        ['query'],
      ),
    'validate_stable_state' : IDL.Func([], [Result_1], ['query']),
    'validate_stable_state_range' : IDL.Func(
        [IDL.Nat, IDL.Nat, IDL.Opt(IDL.Vec(IDL.Nat8))],
        [Result],
        ['query'],
      ),
    'verifying_key_anchor' : IDL.Func(
        [],
        [
          IDL.Record({
            'epoch' : IDL.Nat64,
            'deposit_vk_hex' : IDL.Text,
            'transfer_vk_hex' : IDL.Text,
            'digest' : IDL.Vec(IDL.Nat8),
            'frozen' : IDL.Bool,
            'certified' : IDL.Bool,
          }),
        ],
        ['query'],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
