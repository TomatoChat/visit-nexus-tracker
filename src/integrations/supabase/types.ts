export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      userRoles: {
        Row: {
          id: string
          userId: string
          role: 'admin' | 'internalAgent' | 'externalAgent' | 'guest'
          created_at: string
          updated_at: string
          isActive: boolean
        }
        Insert: {
          id?: string
          userId: string
          role: 'admin' | 'internalAgent' | 'externalAgent' | 'guest'
          created_at?: string
          updated_at?: string
          isActive?: boolean
        }
        Update: {
          id?: string
          userId?: string
          role?: 'admin' | 'internalAgent' | 'externalAgent' | 'guest'
          created_at?: string
          updated_at?: string
          isActive?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "userRoles_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      addresses: {
        Row: {
          addressLine1: string | null
          addressLine2: string | null
          city: string
          country: string
          created_at: string
          id: string
          isactive: boolean
          latitude: number
          longitude: number
          postalCode: string | null
          stateProvince: string
          updated_at: string
        }
        Insert: {
          addressLine1?: string | null
          addressLine2?: string | null
          city: string
          country: string
          created_at?: string
          id?: string
          isactive?: boolean
          latitude: number
          longitude: number
          postalCode?: string | null
          stateProvince: string
          updated_at?: string
        }
        Update: {
          addressLine1?: string | null
          addressLine2?: string | null
          city?: string
          country?: string
          created_at?: string
          id?: string
          isactive?: boolean
          latitude?: number
          longitude?: number
          postalCode?: string | null
          stateProvince?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          addressId: string
          categoryId: string
          codeVAT: string
          created_at: string
          id: string
          isActive: boolean
          isSeller: boolean
          isSupplier: boolean
          name: string
          phoneNumber: string | null
          updated_at: string
        }
        Insert: {
          addressId: string
          categoryId: string
          codeVAT: string
          created_at?: string
          id?: string
          isActive?: boolean
          isSeller: boolean
          isSupplier: boolean
          name: string
          phoneNumber?: string | null
          updated_at?: string
        }
        Update: {
          addressId?: string
          categoryId?: string
          codeVAT?: string
          created_at?: string
          id?: string
          isActive?: boolean
          isSeller?: boolean
          isSupplier?: boolean
          name?: string
          phoneNumber?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_addressId_fkey"
            columns: ["addressId"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_categoryId_fkey"
            columns: ["categoryId"]
            isOneToOne: false
            referencedRelation: "companyCategories"
            referencedColumns: ["id"]
          },
        ]
      }
      companyCategories: {
        Row: {
          created_at: string
          id: string
          name: string
          sellerCategory: boolean
          supplierCategory: boolean
          updated_at: string
          isactive: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sellerCategory: boolean
          supplierCategory: boolean
          updated_at?: string
          isactive?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sellerCategory?: boolean
          supplierCategory?: boolean
          updated_at?: string
          isactive?: boolean
        }
        Relationships: []
      }
      companySellingPoint: {
        Row: {
          created_at: string
          endDate: string | null
          id: string
          sellerSellingPointCode: string | null
          sellingPointId: string
          startDate: string
          supplierCompanyId: string
          updated_at: string
          isactive: boolean
        }
        Insert: {
          created_at?: string
          endDate?: string | null
          id?: string
          sellerSellingPointCode?: string | null
          sellingPointId: string
          startDate: string
          supplierCompanyId: string
          updated_at?: string
          isactive?: boolean
        }
        Update: {
          created_at?: string
          endDate?: string | null
          id?: string
          sellerSellingPointCode?: string | null
          sellingPointId?: string
          startDate?: string
          supplierCompanyId?: string
          updated_at?: string
          isactive?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "companySellingPoint_sellingPointId_fkey"
            columns: ["sellingPointId"]
            isOneToOne: false
            referencedRelation: "sellingPoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companySellingPoint_supplierCompanyId_fkey"
            columns: ["supplierCompanyId"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          companyId: string
          created_at: string
          email: string
          id: string
          isActive: boolean
          name: string
          phoneNumber: string
          roleId: string
          sellingPointId: string | null
          surname: string
          updated_at: string
        }
        Insert: {
          companyId: string
          created_at?: string
          email: string
          id?: string
          isActive?: boolean
          name: string
          phoneNumber: string
          roleId: string
          sellingPointId?: string | null
          surname: string
          updated_at?: string
        }
        Update: {
          companyId?: string
          created_at?: string
          email?: string
          id?: string
          isActive?: boolean
          name?: string
          phoneNumber?: string
          roleId?: string
          sellingPointId?: string | null
          surname?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_companyId_fkey"
            columns: ["companyId"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_roleId_fkey"
            columns: ["roleId"]
            isOneToOne: false
            referencedRelation: "personRoles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_sellingPointId_fkey"
            columns: ["sellingPointId"]
            isOneToOne: false
            referencedRelation: "sellingPoints"
            referencedColumns: ["id"]
          },
        ]
      }
      personRoles: {
        Row: {
          created_at: string
          id: string
          isAgent: boolean
          isExternal: boolean
          name: string
          updated_at: string
          isactive: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          isAgent: boolean
          isExternal: boolean
          name: string
          updated_at?: string
          isactive?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          isAgent?: boolean
          isExternal?: boolean
          name?: string
          updated_at?: string
          isactive?: boolean
        }
        Relationships: []
      }
      sellingPoints: {
        Row: {
          addressId: string
          created_at: string
          id: string
          name: string
          phoneNumber: string | null
          sellerCompanyId: string
          updated_at: string
          isactive: boolean
        }
        Insert: {
          addressId: string
          created_at?: string
          id?: string
          name: string
          phoneNumber?: string | null
          sellerCompanyId: string
          updated_at?: string
          isactive?: boolean
        }
        Update: {
          addressId?: string
          created_at?: string
          id?: string
          name?: string
          phoneNumber?: string | null
          sellerCompanyId?: string
          updated_at?: string
          isactive?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sellingPoints_addressId_fkey"
            columns: ["addressId"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sellingPoints_sellerCompanyId_fkey"
            columns: ["sellerCompanyId"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      visitActivities: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          isactive: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          isactive?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          isactive?: boolean
        }
        Relationships: []
      }
      visits: {
        Row: {
          activityId: string
          agentId: string
          created_at: string
          id: string
          personVisitedId: string | null
          sellingPointId: string
          supplierCompanyId: string
          updated_at: string
          visitDate: string
        }
        Insert: {
          activityId: string
          agentId: string
          created_at?: string
          id?: string
          personVisitedId?: string | null
          sellingPointId: string
          supplierCompanyId: string
          updated_at?: string
          visitDate: string
        }
        Update: {
          activityId?: string
          agentId?: string
          created_at?: string
          id?: string
          personVisitedId?: string | null
          sellingPointId?: string
          supplierCompanyId?: string
          updated_at?: string
          visitDate?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_activityId_fkey"
            columns: ["activityId"]
            isOneToOne: false
            referencedRelation: "visitActivities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_agentId_fkey"
            columns: ["agentId"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_personVisitedId_fkey"
            columns: ["personVisitedId"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_sellingPointId_fkey"
            columns: ["sellingPointId"]
            isOneToOne: false
            referencedRelation: "sellingPoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_supplierCompanyId_fkey"
            columns: ["supplierCompanyId"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
