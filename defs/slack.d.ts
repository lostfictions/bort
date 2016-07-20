declare module '@slack/client' {
  interface Payload {
    ok: boolean
    self: Self
    team: Team
    latest_event_ts: string
    channels: Channel[]
    groups: any[]
    ims: Im[]
    cache_ts: number
    subteams: {
      self: any[]
      all: any[]
    }
    dnd: {
      dnd_enabled: boolean
      next_dnd_start_ts: number
      next_dnd_end_ts: number
      snooze_enabled: boolean
    }
    users: User[]
    cache_version: string
    cache_ts_version: string
    bots: Bot[]
    url: string
  }

  interface Self {
    id: string
    name: string
    prefs: Prefs
    created: number
    manual_presence: string
  }

  interface Prefs {
    highlight_words: string
    user_colors: string
    color_names_in_list: boolean
    growls_enabled: boolean
    tz: void
    push_dm_alert: boolean
    push_mention_alert: boolean
    msg_replies: string
    push_everything: boolean
    push_idle_wait: number
    push_sound: string
    push_loud_channels: string
    push_mention_channels: string
    push_loud_channels_set: string
    email_alerts: string
    email_alerts_sleep_until: number
    email_misc: boolean
    email_weekly: boolean
    welcome_message_hidden: boolean
    all_channels_loud: boolean
    loud_channels: string
    never_channels: string
    loud_channels_set: string
    show_member_presence: boolean
    search_sort: string
    expand_inline_imgs: boolean
    expand_internal_inline_imgs: boolean
    expand_snippets: boolean
    posts_formatting_guide: boolean
    seen_welcome_2: boolean
    seen_ssb_prompt: boolean
    spaces_new_xp_banner_dismissed: boolean
    search_only_my_channels: boolean
    emoji_mode: string
    emoji_use: string
    has_invited: boolean
    has_uploaded: boolean
    has_created_channel: boolean
    search_exclude_channels: string
    messages_theme: string
    webapp_spellcheck: boolean
    no_joined_overlays: boolean
    no_created_overlays: boolean
    dropbox_enabled: boolean
    seen_domain_invite_reminder: boolean
    seen_member_invite_reminder: boolean
    mute_sounds: boolean
    arrow_history: boolean
    tab_ui_return_selects: boolean
    obey_inline_img_limit: boolean
    new_msg_snd: string
    require_at: boolean
    ssb_space_window: string
    mac_ssb_bounce: string
    mac_ssb_bullet: boolean
    expand_non_media_attachments: boolean
    show_typing: boolean
    pagekeys_handled: boolean
    last_snippet_type: string
    display_real_names_override: number
    display_preferred_names: boolean
    time24: boolean
    enter_is_special_in_tbt: boolean
    graphic_emoticons: boolean
    convert_emoticons: boolean
    ss_emojis: boolean
    sidebar_behavior: string
    seen_onboarding_start: boolean
    onboarding_cancelled: boolean
    seen_onboarding_slackbot_conversation: boolean
    seen_onboarding_channels: boolean
    seen_onboarding_direct_messages: boolean
    seen_onboarding_invites: boolean
    seen_onboarding_search: boolean
    seen_onboarding_recent_mentions: boolean
    seen_onboarding_starred_items: boolean
    seen_onboarding_private_groups: boolean
    onboarding_slackbot_conversation_step: number
    dnd_enabled: boolean
    dnd_start_hour: string
    dnd_end_hour: string
    mark_msgs_read_immediately: boolean
    start_scroll_at_oldest: boolean
    snippet_editor_wrap_long_lines: boolean
    ls_disabled: boolean
    sidebar_theme: string
    sidebar_theme_custom_values: string
    f_key_search: boolean
    k_key_omnibox: boolean
    speak_growls: boolean
    mac_speak_voice: string
    mac_speak_speed: number
    comma_key_prefs: boolean
    at_channel_suppressed_channels: string
    push_at_channel_suppressed_channels: string
    prompted_for_email_disabling: boolean
    full_text_extracts: boolean
    no_text_in_notifications: boolean
    muted_channels: string
    no_macssb1_banner: boolean
    no_macssb2_banner: boolean
    no_winssb1_banner: boolean
    no_omnibox_in_channels: boolean
    k_key_omnibox_auto_hide_count: number
    hide_user_group_info_pane: boolean
    mentions_exclude_at_user_groups: boolean
    privacy_policy_seen: boolean
    search_exclude_bots: boolean
    load_lato_2: boolean
    fuller_timestamps: boolean
    last_seen_at_channel_warning: number
    flex_resize_window: boolean
    msg_preview: boolean
    msg_preview_displaces: boolean
    msg_preview_persistent: boolean
    emoji_autocomplete_big: boolean
    winssb_run_from_tray: boolean
    winssb_window_flash_behavior: string
    two_factor_auth_enabled: boolean
    two_factor_type: void
    two_factor_backup_type: void
    enhanced_debugging: boolean
    mentions_exclude_at_channels: boolean
    confirm_clear_all_unreads: boolean
    confirm_user_marked_away: boolean
    box_enabled: boolean
    seen_single_emoji_msg: boolean
    confirm_sh_call_start: boolean
    preferred_skin_tone: string
    show_all_skin_tones: boolean
    separate_private_channels: boolean
    whats_new_read: number
    hotness: boolean
    frecency_jumper: string
    jumbomoji: boolean
    no_flex_in_history: boolean
    newxp_seen_last_message: number
    attachments_with_borders: boolean
    channel_sort: string
    a11y_font_size: string
  }

  interface Reaction {
    name: string
    title: string
  }

  interface TeamPrefs {
    invites_only_admins: boolean
    default_channels: string[]
    allow_calls: boolean
    username_policy: string
    who_can_at_everyone: string
    who_can_at_channel: string
    who_can_post_general: string
    warn_before_at_channel: string
    gateway_allow_xmpp_ssl: boolean
    gateway_allow_irc_ssl: boolean
    gateway_allow_irc_plain: boolean
    who_can_manage_integrations: {
      type: string[]
    }
    commands_only_regular: boolean
    dnd_enabled: boolean
    dnd_start_hour: string
    dnd_end_hour: string
    hide_referers: boolean
    msg_edit_window_mins: number
    allow_message_deletion: boolean
    display_real_names: boolean
    who_can_create_channels: string
    who_can_archive_channels: string
    who_can_create_groups: string
    who_can_kick_channels: string
    who_can_kick_groups: string
    retention_type: number
    retention_duration: number
    group_retention_type: number
    group_retention_duration: number
    dm_retention_type: number
    dm_retention_duration: number
    file_retention_duration: number
    file_retention_type: number
    allow_retention_override: boolean
    require_at_for_mention: boolean
    default_rxns: string[]
    team_handy_rxns: {
      restrict: boolean
      list: Reaction[]
    }
    channel_handy_rxns: void
    compliance_export_start: number
    disallow_public_file_urls: boolean
    who_can_create_delete_user_groups: string
    who_can_edit_user_groups: string
    who_can_change_team_profile: string
    allow_shared_channels: boolean
    who_has_team_visibility: string
    disable_file_uploads: string
    who_can_create_shared_channels: string
    who_can_manage_shared_channels: {
      type: string[]
    }
    who_can_post_in_shared_channels: {
      type: string[]
    }
    allow_shared_channel_perms_override: boolean
    auth_mode: string
    invites_limit: boolean
  }

  interface TeamIcon {
    image_34: string
    image_44: string
    image_68: string
    image_88: string
    image_102: string
    image_132: string
    image_230: string
    image_original: string
  }

  interface Team {
    id: string
    name: string
    email_domain: string
    domain: string
    msg_edit_window_mins: number
    prefs: TeamPrefs
    icon: TeamIcon
    over_storage_limit: boolean
    plan: string
    over_integrations_limit: boolean
  }

  interface Channel {
    id: string
    name: string
    is_channel: boolean
    created: number
    creator: string
    is_archived: boolean
    is_general: boolean
    has_pins: boolean
    is_member: boolean
    last_read: string
    unread_count: number
    unread_count_display: number
    //TODO
    history: any
    latest: any 
    members: any
    topic: any
    purpose: any
  }

  interface Im {
    id: string
    user: string
    created: number
    is_im: boolean
    is_org_shared: boolean
    has_pins: boolean
    last_read: string
    is_open: boolean
    unread_count: number
    unread_count_display: number
    //TODO
    latest: any
  }

  interface User {
    id: string
    team_id: string
    name: string
    deleted: boolean
    status: void
    color: string
    real_name: string
    tz: void
    tz_label: string
    tz_offset: number
    profile: {
      first_name: string
      last_name: string
      image_24: string
      image_32: string
      image_48: string
      image_72: string
      image_192: string
      image_512: string
      image_1024: string
      image_original: string
      avatar_hash?: string
      real_name: string
      real_name_normalized: string
      email: void
      fields: void
      bot_id?: string
      api_app_id?: string
    }
    is_admin: boolean
    is_owner: boolean
    is_primary_owner: boolean
    is_restricted: boolean
    is_ultra_restricted: boolean
    is_bot: boolean
    presence: string
  }

  interface Bot {
    id: string
    deleted: boolean
    name: string
    icons: {
      image_36: string
      image_48: string
      image_72: string
    }
  }

  abstract class DataStore {
    logger(...args : any[]) : void
    users: { [id : string] : User }
    channels: { [id : string] : Channel }
    dms: { [id : string] : Im }
    groups: { [id: string] : any } //TODO
    bots: { [id : string] : Bot }
    teams: { [id : string] : Team }
  }

  interface ClientOpts {
    dataStore?: DataStore
    maxReconnectionAttempts?: number
    reconnectionBackoff?: number
    maxPongInterval?: number
    wsPingInterval?: number
    autoReconnect?: boolean
    logLevel?: string
    logger?: (logLevel : string, logMessage : string) => void
  }

  export class RtmClient {
    constructor(token : string, opts : ClientOpts)
    start(opts?: any) : void
    ws : any
    MAX_RECONNECTION_ATTEMPTS : number
    RECONNECTION_BACKOFF : number
    MAX_PONG_INTERVAL : number
    WS_PING_INTERVAL : number
    autoReconnect : boolean
    connected : boolean
    authenticated : boolean
    activeUserId : string
    activeTeamId : string
    dataStore : DataStore
    nextMessageId() : number
    disconnect(optErr : string, optCode : number) : void
    reconnect() : void
    handleWsOpen: () => void
    handleWsMessage : (wsMsg : any) => void
    handleWsError : (err : any) => void
    handleWsClose : (code : any, reason : string) => void
    sendMessage(text : string, channelId : string, optCb?: () => void) : Promise<any>
    updateMessage(message : any, optCb?: () => void) : Promise<any>
    sendTyping(channelId : string) : void
    send(message : any, optCb?: () => void) : Promise<any>
    on(type: "open", listener: (this: this) => void): void;
  }

  export class MemoryDataStore extends DataStore {}
  export const WebClient : any
}

